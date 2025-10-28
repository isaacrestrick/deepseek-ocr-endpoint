#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"

echo -e "${GREEN}==================================="
echo "DeepSeek-OCR Instance Starter"
echo -e "===================================${NC}"

# Check if terraform outputs are available
if [ ! -d "$TERRAFORM_DIR" ]; then
    echo -e "${RED}Error: Terraform directory not found${NC}"
    echo "Please run this script from the deepseek-infra directory"
    exit 1
fi

cd "$TERRAFORM_DIR"

# Get instance ID from terraform output
echo "Getting instance information..."
INSTANCE_ID=$(terraform output -raw instance_id 2>/dev/null)
REGION=$(terraform output -json | jq -r '.aws_region.value // "us-east-1"')

if [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}Error: Could not get instance ID from Terraform${NC}"
    echo "Make sure you've run 'terraform apply' first"
    exit 1
fi

# Get current instance state
echo "Checking instance state..."
CURRENT_STATE=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text)

echo -e "Current state: ${YELLOW}$CURRENT_STATE${NC}"

if [ "$CURRENT_STATE" == "running" ]; then
    echo -e "${GREEN}Instance is already running!${NC}"
    API_ENDPOINT=$(terraform output -raw api_endpoint)
    echo -e "API Endpoint: ${GREEN}$API_ENDPOINT${NC}"
    exit 0
fi

if [ "$CURRENT_STATE" == "pending" ]; then
    echo -e "${YELLOW}Instance is already starting...${NC}"
elif [ "$CURRENT_STATE" == "stopped" ]; then
    echo "Starting instance..."
    aws ec2 start-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$REGION" > /dev/null
    echo -e "${GREEN}Start command sent${NC}"
else
    echo -e "${RED}Instance is in unexpected state: $CURRENT_STATE${NC}"
    exit 1
fi

# Wait for instance to be running
echo "Waiting for instance to start (this takes ~30-60 seconds)..."
aws ec2 wait instance-running \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION"

echo -e "${GREEN}Instance is running!${NC}"

# Get API endpoint
API_ENDPOINT=$(terraform output -raw api_endpoint)
echo -e "API Endpoint: ${GREEN}$API_ENDPOINT${NC}"

# Wait for API to be ready
echo ""
echo "Waiting for vLLM API to be ready (this takes ~1-2 minutes)..."
echo "The model needs to load into GPU memory..."

MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s -f "$API_ENDPOINT/health" > /dev/null 2>&1; then
        echo -e "${GREEN}API is ready!${NC}"
        echo ""
        echo -e "${GREEN}==================================="
        echo "DeepSeek-OCR is ready to use!"
        echo -e "===================================${NC}"
        echo -e "API Endpoint: ${GREEN}$API_ENDPOINT${NC}"
        echo ""
        echo "Test with:"
        echo "  cd $SCRIPT_DIR"
        echo "  python3 test-api.py"
        echo ""
        echo "When done, stop the instance with:"
        echo "  ./stop-instance.sh"
        exit 0
    fi

    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 5
done

echo ""
echo -e "${YELLOW}Warning: API health check timed out${NC}"
echo "The instance is running but the API may still be initializing."
echo "Check logs with:"
echo "  ssh ubuntu@$(terraform output -raw instance_public_ip)"
echo "  docker logs -f deepseek-ocr"
