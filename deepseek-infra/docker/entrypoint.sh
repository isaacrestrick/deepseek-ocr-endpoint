#!/bin/bash
set -e

echo "==================================="
echo "DeepSeek-OCR vLLM Container Starting"
echo "==================================="
echo "Time: $(date)"
echo "Token Compression Mode: ${TOKEN_COMPRESSION_MODE:-base}"
echo "GPU Memory Utilization: ${GPU_MEMORY_UTILIZATION:-0.9}"
echo "Max Model Length: ${MAX_MODEL_LEN:-4096}"
echo "==================================="

# Check NVIDIA GPU availability
if ! nvidia-smi &> /dev/null; then
    echo "ERROR: NVIDIA GPU not detected!"
    echo "Please ensure:"
    echo "  1. GPU drivers are installed"
    echo "  2. nvidia-container-toolkit is configured"
    echo "  3. Docker is using the nvidia runtime"
    exit 1
fi

echo "GPU Information:"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
echo "==================================="

# Check if model cache directory is writable
if [ ! -w "$HF_HOME" ]; then
    echo "ERROR: Model cache directory $HF_HOME is not writable"
    exit 1
fi

echo "Model cache directory: $HF_HOME"
echo "Checking for existing model files..."

# Show disk usage
df -h "$HF_HOME"

echo "==================================="
echo "Starting vLLM server..."
echo "This will download the model on first run (~6.6GB)"
echo "Expected download time: 5-10 minutes depending on connection"
echo "==================================="

# Start vLLM with parameters
exec python3 -m vllm.entrypoints.openai.api_server \
    --model deepseek-ai/DeepSeek-OCR \
    --trust-remote-code \
    --enable-prefix-caching=False \
    --mm-processor-kwargs="{\"compression_mode\":\"${TOKEN_COMPRESSION_MODE:-base}\"}" \
    --gpu-memory-utilization "${GPU_MEMORY_UTILIZATION:-0.9}" \
    --max-model-len "${MAX_MODEL_LEN:-4096}" \
    --host 0.0.0.0 \
    --port 8000
