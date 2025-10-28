# Quick Start Guide

Get DeepSeek-OCR running on AWS in 5 minutes.

## Prerequisites

- AWS account with CLI configured (`aws configure`)
- Terraform installed
- SSH key pair created in AWS EC2 Console

## Steps

### 1. Configure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `ssh_key_name` = your AWS key name
- `allowed_ips` = ["YOUR.IP.ADDRESS/32"]  # Find with: curl ifconfig.me

### 2. Deploy

```bash
terraform init
terraform apply
```

Type "yes" when prompted. Wait ~5 minutes for deployment.

### 3. Wait for Model Download

First startup downloads the model (~6.6GB). This takes an additional 5-10 minutes.

Check progress:
```bash
# Get instance IP from terraform output
INSTANCE_IP=$(terraform output -raw instance_public_ip)

# SSH and watch logs
ssh -i ~/.ssh/your-key.pem ubuntu@$INSTANCE_IP
docker logs -f deepseek-ocr
```

### 4. Test

```bash
cd ../scripts
python3 test-api.py
```

### 5. Use the API

```python
import requests
import base64

API_ENDPOINT = "http://YOUR-IP:8000"  # From terraform output

with open("document.png", "rb") as f:
    img_base64 = base64.b64encode(f.read()).decode()

response = requests.post(
    f"{API_ENDPOINT}/v1/chat/completions",
    json={
        "model": "deepseek-ai/DeepSeek-OCR",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": "Extract all text from this image."},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_base64}"}}
            ]
        }],
        "max_tokens": 512
    }
)

print(response.json()['choices'][0]['message']['content'])
```

### 6. Stop When Done

```bash
cd ../scripts
./stop-instance.sh
```

**Important**: Always stop the instance to avoid charges!

## Daily Usage

```bash
# Start instance
cd scripts
./start-instance.sh

# Use the API...

# Stop instance when done
./stop-instance.sh
```

## Cost

- **Running**: $0.526/hour
- **Stopped**: ~$8/month (storage only)
- **2hrs/day × 25 days**: ~$34/month total

## Need Help?

See the full [README.md](README.md) for detailed documentation.
