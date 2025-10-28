#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"

echo -e "${BLUE}==================================="
echo "DeepSeek-OCR Status Check"
echo -e "===================================${NC}"

# Check if terraform outputs are available
if [ ! -d "$TERRAFORM_DIR" ]; then
    echo -e "${RED}Error: Terraform directory not found${NC}"
    exit 1
fi

cd "$TERRAFORM_DIR"

# Get instance information
INSTANCE_ID=$(terraform output -raw instance_id 2>/dev/null)
REGION=$(terraform output -json | jq -r '.aws_region.value // "us-east-1"')

if [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}Error: Could not get instance ID from Terraform${NC}"
    exit 1
fi

# Get instance details
INSTANCE_INFO=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0]' \
    --output json)

STATE=$(echo "$INSTANCE_INFO" | jq -r '.State.Name')
INSTANCE_TYPE=$(echo "$INSTANCE_INFO" | jq -r '.InstanceType')
LAUNCH_TIME=$(echo "$INSTANCE_INFO" | jq -r '.LaunchTime')
PUBLIC_IP=$(echo "$INSTANCE_INFO" | jq -r '.PublicIpAddress // "N/A"')

# Color code the state
case $STATE in
    running)
        STATE_COLOR="${GREEN}"
        ;;
    stopped)
        STATE_COLOR="${YELLOW}"
        ;;
    *)
        STATE_COLOR="${RED}"
        ;;
esac

echo ""
echo -e "${BLUE}Instance Information:${NC}"
echo "  Instance ID:   $INSTANCE_ID"
echo "  Instance Type: $INSTANCE_TYPE"
echo -e "  State:         ${STATE_COLOR}$STATE${NC}"
echo "  Public IP:     $PUBLIC_IP"
echo "  Launch Time:   $LAUNCH_TIME"
echo ""

# Calculate uptime if running
if [ "$STATE" == "running" ]; then
    UPTIME_SECONDS=$(( $(date +%s) - $(date -d "$LAUNCH_TIME" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$(echo $LAUNCH_TIME | cut -d. -f1)" +%s) ))
    UPTIME_HOURS=$(( UPTIME_SECONDS / 3600 ))
    UPTIME_MINUTES=$(( (UPTIME_SECONDS % 3600) / 60 ))

    echo -e "${BLUE}Runtime Information:${NC}"
    echo "  Uptime:        ${UPTIME_HOURS}h ${UPTIME_MINUTES}m"
    echo "  Cost so far:   ~\$$(echo "scale=2; $UPTIME_HOURS * 0.526" | bc) (compute only)"
    echo ""

    # Check API health
    API_ENDPOINT=$(terraform output -raw api_endpoint 2>/dev/null)

    echo -e "${BLUE}API Status:${NC}"
    echo "  Endpoint: $API_ENDPOINT"

    if curl -s -f "$API_ENDPOINT/health" > /dev/null 2>&1; then
        echo -e "  Health:   ${GREEN}✓ Healthy${NC}"

        # Try to get model info
        MODEL_INFO=$(curl -s "$API_ENDPOINT/v1/models" 2>/dev/null | jq -r '.data[0].id // "unknown"' 2>/dev/null || echo "unknown")
        echo "  Model:    $MODEL_INFO"
    else
        echo -e "  Health:   ${RED}✗ Not responding${NC}"
        echo "  (API may still be initializing - check docker logs)"
    fi
    echo ""

    echo -e "${BLUE}Quick Commands:${NC}"
    echo "  Stop instance:     ./stop-instance.sh"
    echo "  Test API:          python3 test-api.py"
    echo "  View logs:         ssh ubuntu@$PUBLIC_IP 'docker logs -f deepseek-ocr'"

elif [ "$STATE" == "stopped" ]; then
    echo -e "${BLUE}Instance Actions:${NC}"
    echo "  Start instance:    ./start-instance.sh"
    echo "  Or use CLI:        aws ec2 start-instances --instance-ids $INSTANCE_ID --region $REGION"

else
    echo -e "${YELLOW}Instance is in transitional state: $STATE${NC}"
    echo "Please wait a moment and check again."
fi

echo ""
echo -e "${BLUE}Cost Estimate:${NC}"
echo "  Instance type:     $INSTANCE_TYPE"
echo "  Hourly rate:       \$0.526/hour (approximate)"
echo "  Storage (100GB):   ~\$8/month"
echo "  2hrs/day × 25days: ~\$26/month compute + \$8 storage = \$34/month"
echo ""
