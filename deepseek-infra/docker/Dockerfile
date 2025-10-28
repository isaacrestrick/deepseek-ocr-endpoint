# DeepSeek-OCR Docker Image with vLLM
# Based on NVIDIA CUDA for GPU acceleration

FROM nvidia/cuda:11.8.0-devel-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/model-cache \
    VLLM_WORKER_MULTIPROC_METHOD=spawn

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.12 \
    python3.12-dev \
    python3-pip \
    git \
    wget \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Update pip and install Python dependencies
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch with CUDA support
RUN pip3 install --no-cache-dir \
    torch==2.6.0 \
    torchvision==0.21.0 \
    torchaudio==2.6.0 \
    --index-url https://download.pytorch.org/whl/cu118

# Install vLLM (use nightly for latest DeepSeek-OCR support)
RUN pip3 install --no-cache-dir vllm>=0.8.5

# Install additional dependencies
RUN pip3 install --no-cache-dir \
    transformers>=4.46.3 \
    tokenizers>=0.20.3 \
    pillow \
    requests \
    fastapi \
    uvicorn

# Create model cache directory
RUN mkdir -p /model-cache && chmod 777 /model-cache

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose vLLM API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]
