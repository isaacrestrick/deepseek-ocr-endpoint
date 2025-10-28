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

echo -e "${YELLOW}==================================="
echo "DeepSeek-OCR Instance Stopper"
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

if [ "$CURRENT_STATE" == "stopped" ]; then
    echo -e "${GREEN}Instance is already stopped${NC}"
    exit 0
fi

if [ "$CURRENT_STATE" == "stopping" ]; then
    echo -e "${YELLOW}Instance is already stopping...${NC}"
    echo "Waiting for instance to stop..."
    aws ec2 wait instance-stopped \
        --instance-ids "$INSTANCE_ID" \
        --region "$REGION"
    echo -e "${GREEN}Instance is stopped${NC}"
    exit 0
fi

if [ "$CURRENT_STATE" != "running" ]; then
    echo -e "${RED}Instance is in unexpected state: $CURRENT_STATE${NC}"
    echo "Cannot stop instance in this state"
    exit 1
fi

# Stop the instance
echo "Stopping instance..."
aws ec2 stop-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" > /dev/null

echo -e "${GREEN}Stop command sent${NC}"

# Wait for instance to stop
echo "Waiting for instance to stop (this takes ~30-60 seconds)..."
aws ec2 wait instance-stopped \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION"

echo -e "${GREEN}==================================="
echo "Instance stopped successfully!"
echo -e "===================================${NC}"
echo ""
echo "The instance is now stopped. You are only paying for storage (~\$8/month)."
echo ""
echo "To start the instance again, run:"
echo "  ./start-instance.sh"
echo ""
echo "Or use AWS CLI:"
echo "  aws ec2 start-instances --instance-ids $INSTANCE_ID --region $REGION"
