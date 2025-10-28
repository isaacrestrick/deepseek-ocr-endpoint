# DeepSeek-OCR on AWS

Infrastructure-as-Code setup for hosting DeepSeek-OCR on AWS EC2 with GPU acceleration. Optimized for development use with manual start/stop control.

> **⚠️ Important - Dynamic IP Address**
>
> Your current configuration has `create_elastic_ip = false` to save costs ($3.60/month savings).
> This means **the API endpoint IP will change every time you stop/start the instance**.
>
> Always check the current IP address after starting:
> ```bash
> cd terraform && terraform output api_endpoint
> ```
>
> If you want a static IP that never changes, set `create_elastic_ip = true` in `terraform/terraform.tfvars`.

## Overview

This project provides a complete Terraform-based infrastructure to deploy DeepSeek-OCR (a 3B parameter Vision-Language Model for OCR) on AWS. The setup includes:

- **GPU-enabled EC2 instance** (g4dn.xlarge with NVIDIA T4)
- **vLLM inference server** with OpenAI-compatible API
- **Docker containerization** for easy deployment
- **Manual start/stop control** for cost optimization
- **Helper scripts** for instance management and API testing

### Cost Estimate

| Usage Pattern | Monthly Cost |
|---------------|--------------|
| 2 hours/day, 25 days | ~$26 compute + $8 storage = **$34/month** |
| 3 hours/day, 25 days | ~$39 compute + $8 storage = **$47/month** |
| 24/7 operation | ~$384 compute + $8 storage = **$392/month** |

**Key**: Stop the instance when not in use to minimize costs!

## Architecture

```
┌─────────────────────────────────────────┐
│ AWS Cloud                               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ EC2 Instance (g4dn.xlarge)        │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │ Docker Container            │ │ │
│  │  │                             │ │ │
│  │  │  - vLLM Server              │ │ │
│  │  │  - DeepSeek-OCR Model       │ │ │
│  │  │  - OpenAI-compatible API    │ │ │
│  │  │    (port 8000)              │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                   │ │
│  │  - NVIDIA T4 GPU (16GB)          │ │
│  │  - 4 vCPUs, 16GB RAM             │ │
│  │  - 100GB EBS storage             │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Security Group: SSH (22), API (8000)  │
│  Elastic IP: Static endpoint           │
└─────────────────────────────────────────┘
```

## Prerequisites

Before you begin, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```
3. **Terraform** >= 1.0 installed
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```
4. **SSH Key Pair** created in AWS EC2
   - Go to: EC2 Console > Key Pairs > Create Key Pair
   - Save the `.pem` file securely
5. **Python 3** (for testing scripts)
6. **jq** (for JSON parsing in scripts)
   ```bash
   # macOS
   brew install jq

   # Linux
   sudo apt-get install jq
   ```

## Quick Start

### 1. Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and update:

```hcl
# REQUIRED: Your SSH key name from AWS
ssh_key_name = "your-key-name"

# REQUIRED: Your IP address for security
# Find your IP: curl ifconfig.me
allowed_ips = ["YOUR.IP.ADDRESS/32"]

# Optional: Change region if needed
aws_region = "us-east-1"
```

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy (takes ~5 minutes)
terraform apply
```

**Note**: On first startup, the instance will download the DeepSeek-OCR model (~6.6GB), which takes an additional 5-10 minutes.

### 3. Get Connection Info

After deployment, Terraform outputs the connection details:

```bash
terraform output
```

You'll see:
- `instance_id`: EC2 instance ID
- `api_endpoint`: API URL (e.g., http://X.X.X.X:8000)
- `ssh_command`: SSH connection command
- `start_instance_command`: Command to start
- `stop_instance_command`: Command to stop

### 4. Test the API

```bash
cd ../scripts

# Make scripts executable
chmod +x *.sh

# Test the API
python3 test-api.py
```

## Usage

### Starting the Instance

```bash
cd scripts
./start-instance.sh
```

This script will:
1. Start the EC2 instance
2. Wait for it to boot (~1 minute)
3. Wait for the API to be ready (~1-2 minutes)
4. Show you the API endpoint

### Stopping the Instance

```bash
cd scripts
./stop-instance.sh
```

**Important**: Always stop the instance when not in use to minimize costs!

### Checking Status

```bash
cd scripts
./check-status.sh
```

Shows:
- Instance state (running/stopped)
- Uptime and cost-to-date
- API health status
- Available commands

### Manual Control (Alternative)

You can also use AWS CLI directly:

```bash
# Get instance ID
INSTANCE_ID=$(cd terraform && terraform output -raw instance_id)

# Start instance
aws ec2 start-instances --instance-ids $INSTANCE_ID

# Stop instance
aws ec2 stop-instances --instance-ids $INSTANCE_ID

# Check state
aws ec2 describe-instances --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].State.Name' --output text
```

## API Usage

The DeepSeek-OCR endpoint is OpenAI-compatible. Here's how to use it:

### Python Example

```python
import requests
import base64

# Get API endpoint from terraform output
API_ENDPOINT = "http://YOUR-IP:8000"

# Read and encode image
with open("document.png", "rb") as f:
    img_base64 = base64.b64encode(f.read()).decode()

# Make OCR request
response = requests.post(
    f"{API_ENDPOINT}/v1/chat/completions",
    json={
        "model": "deepseek-ai/DeepSeek-OCR",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all text from this image."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{img_base64}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 512,
        "temperature": 0.0
    }
)

result = response.json()
extracted_text = result['choices'][0]['message']['content']
print(extracted_text)
```

### cURL Example

```bash
API_ENDPOINT="http://YOUR-IP:8000"

# Encode image to base64
IMG_BASE64=$(base64 -i document.png)

# Make request
curl -X POST "$API_ENDPOINT/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"deepseek-ai/DeepSeek-OCR\",
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": [
          {\"type\": \"text\", \"text\": \"Extract all text from this image.\"},
          {\"type\": \"image_url\", \"image_url\": {\"url\": \"data:image/png;base64,$IMG_BASE64\"}}
        ]
      }
    ],
    \"max_tokens\": 512,
    \"temperature\": 0.0
  }"
```

### Available Endpoints

- `GET /health` - Health check
- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Chat completion (OCR)
- `POST /v1/completions` - Text completion

## Configuration

### Token Compression Modes

DeepSeek-OCR supports different compression modes. Edit `terraform/terraform.tfvars`:

```hcl
token_compression_mode = "base"  # Options: tiny, small, base, large, gundam
```

| Mode | Resolution | Tokens | Use Case |
|------|------------|--------|----------|
| tiny | 512×512 | 64 | Quick OCR, low detail |
| small | 640×640 | 100 | Standard documents |
| **base** | 1024×1024 | 256 | **Recommended default** |
| large | 1280×1280 | 400 | High-detail documents |
| gundam | Multiple views | n×100+256 | Complex layouts |

### Instance Types

Edit `terraform/terraform.tfvars` to change instance type:

```hcl
instance_type = "g4dn.xlarge"  # Default: $0.526/hr
# instance_type = "g4dn.2xlarge"  # More GPU memory: $0.752/hr
# instance_type = "g5.xlarge"     # Newer GPU: $1.006/hr
```

### Spot Instances (Advanced)

Save 50-70% with spot instances (can be interrupted):

```hcl
use_spot_instance = true
```

## Monitoring

### View Container Logs

```bash
# SSH to instance
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR-IP

# View logs
docker logs -f deepseek-ocr

# Check container status
docker ps
```

### CloudWatch Logs

Logs are automatically sent to CloudWatch:

```bash
# View in AWS Console
# CloudWatch > Log Groups > /aws/ec2/deepseek-ocr
```

## Troubleshooting

### API Not Responding

```bash
# SSH to instance
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR-IP

# Check if Docker is running
sudo systemctl status docker

# Check container status
docker ps

# View logs
docker logs deepseek-ocr

# Restart container if needed
docker-compose restart
```

### Model Download Slow

The first startup downloads ~6.6GB. This can take 5-10 minutes depending on AWS network speed. Monitor progress:

```bash
docker logs -f deepseek-ocr
```

### GPU Not Detected

```bash
# SSH to instance
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR-IP

# Check GPU
nvidia-smi

# Check Docker GPU access
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### Permission Denied (SSH)

```bash
# Fix key permissions
chmod 400 ~/.ssh/your-key.pem
```

### Terraform State Issues

```bash
cd terraform

# Refresh state
terraform refresh

# Re-import if needed
terraform import aws_instance.deepseek_ocr i-xxxxxxxxxxxxx
```

## Security

### Best Practices

1. **Restrict IP Access**: Update `allowed_ips` in `terraform.tfvars` to your IP only:
   ```hcl
   allowed_ips = ["YOUR.IP.ADDRESS/32"]
   ```

2. **Use SSH Key Authentication**: Never use password authentication

3. **Enable API Authentication**: For production, add authentication layer:
   - API Gateway with Lambda authorizer
   - nginx reverse proxy with basic auth
   - VPN or AWS PrivateLink

4. **Encrypt Data**: EBS volumes are encrypted by default

5. **Regular Updates**: Keep AMI and packages updated

### Adding API Authentication (Optional)

For a simple auth layer, add nginx with basic auth:

```bash
# SSH to instance
sudo apt-get install nginx apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd yourusername

# Configure nginx (see nginx-config.example)
sudo systemctl restart nginx
```

## Cost Optimization

### Tips to Minimize Costs

1. **Stop when not in use**: Use `./stop-instance.sh`
2. **Use spot instances**: Save 50-70% (can be interrupted)
3. **Disable Elastic IP**: Save $3.60/month if you don't need static IP
4. **Smaller EBS volume**: Reduce if you don't need 100GB
5. **Use smaller instance**: g4dn.xlarge is sufficient for development

### Cost Breakdown

```
g4dn.xlarge:
  - Compute: $0.526/hour ($384/month if 24/7)
  - Storage: 100GB EBS × $0.08/GB = $8/month
  - Elastic IP: $0 while running, $3.60/month if not attached
  - Data transfer: First 1GB/month free, then $0.09/GB

Development usage (2hrs/day × 25 days):
  - Compute: 50 hours × $0.526 = $26
  - Storage: $8
  - Total: ~$34/month
```

## Advanced Configuration

### Custom Docker Image

To build a custom image with additional dependencies:

```bash
cd docker
docker build -t deepseek-ocr:custom .

# Update docker-compose.yml to use custom image
# Then push to ECR or rebuild on instance
```

### Auto-Stop on Idle (Optional)

Add CloudWatch alarm to stop instance after 30min of no API requests:

```bash
# See terraform/auto-stop.tf.example
```

### Multiple Models

To run multiple models, modify the docker-compose to include multiple vLLM services on different ports.

## Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

**Warning**: This will delete the instance and all data. Model cache will be lost and will need to be re-downloaded on next deployment.

## Project Structure

```
deepseek-infra/
├── terraform/
│   ├── main.tf                 # Core infrastructure
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Output values
│   ├── security_groups.tf      # Security configuration
│   ├── iam.tf                  # IAM roles and policies
│   ├── user_data.sh            # EC2 initialization script
│   └── terraform.tfvars.example # Configuration template
├── docker/
│   ├── Dockerfile              # Custom vLLM image (optional)
│   ├── docker-compose.yml      # Container orchestration
│   └── entrypoint.sh           # Container startup script
├── scripts/
│   ├── start-instance.sh       # Start EC2 instance
│   ├── stop-instance.sh        # Stop EC2 instance
│   ├── check-status.sh         # Check instance status
│   └── test-api.py             # API testing script
├── .gitignore
├── .env.example                # Environment variables template
└── README.md                   # This file
```

## Support

### Resources

- [DeepSeek-OCR GitHub](https://github.com/deepseek-ai/DeepSeek-OCR)
- [vLLM Documentation](https://docs.vllm.ai/)
- [AWS EC2 GPU Instances](https://aws.amazon.com/ec2/instance-types/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

### Common Issues

See [Troubleshooting](#troubleshooting) section above.

## License

This infrastructure code is provided as-is. DeepSeek-OCR model has its own license - check the [official repository](https://github.com/deepseek-ai/DeepSeek-OCR) for details.

## Contributing

Feel free to submit issues or pull requests for improvements.

---

**Note**: This setup is optimized for development use with manual control. For production deployments, consider:
- Auto-scaling with ECS or EKS
- Load balancer for high availability
- API Gateway for authentication/rate limiting
- Monitoring and alerting
- Automated backups
