#!/bin/bash
set -e

# Logging setup
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting DeepSeek-OCR setup at $(date)"

# Update system
apt-get update
apt-get upgrade -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker ubuntu
    systemctl enable docker
    systemctl start docker
fi

# Install NVIDIA Container Toolkit
if ! command -v nvidia-container-toolkit &> /dev/null; then
    echo "Installing NVIDIA Container Toolkit..."
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | apt-key add -
    curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
        tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

    apt-get update
    apt-get install -y nvidia-container-toolkit
    systemctl restart docker
fi

# Configure Docker to use NVIDIA runtime
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# Create directory for model cache
mkdir -p /home/ubuntu/model-cache
chown -R ubuntu:ubuntu /home/ubuntu/model-cache

# Create docker-compose.yml
cat > /home/ubuntu/docker-compose.yml <<'EOF'
version: '3.8'

services:
  vllm:
    image: vllm/vllm-openai:nightly
    container_name: deepseek-ocr
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - HF_HOME=/model-cache
      - VLLM_WORKER_MULTIPROC_METHOD=spawn
    volumes:
      - /home/ubuntu/model-cache:/model-cache
    ports:
      - "8000:8000"
    command: >
      --model deepseek-ai/DeepSeek-OCR
      --trust-remote-code
      --gpu-memory-utilization 0.9
      --max-model-len 4096
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 300s
EOF

chown ubuntu:ubuntu /home/ubuntu/docker-compose.yml

# Install docker-compose if not available
if ! command -v docker-compose &> /dev/null; then
    echo "Installing docker-compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/aws/ec2/deepseek-ocr",
            "log_stream_name": "{instance_id}/user-data"
          },
          {
            "file_path": "/var/log/docker.log",
            "log_group_name": "/aws/ec2/deepseek-ocr",
            "log_stream_name": "{instance_id}/docker"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Start the DeepSeek-OCR service
cd /home/ubuntu
echo "Starting DeepSeek-OCR service..."
sudo -u ubuntu docker-compose up -d

# Create a startup script for automatic restart on reboot
cat > /etc/systemd/system/deepseek-ocr.service <<EOF
[Unit]
Description=DeepSeek-OCR vLLM Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu
Group=ubuntu

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable deepseek-ocr.service

echo "DeepSeek-OCR setup completed at $(date)"
echo "Model is downloading and loading. This may take 5-10 minutes."
echo "Check status with: docker logs -f deepseek-ocr"
