variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type (g4dn.xlarge recommended for development)"
  type        = string
  default     = "g4dn.xlarge"
}

variable "allowed_ips" {
  description = "List of IP addresses allowed to access the API and SSH (CIDR notation)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # WARNING: Change this to your IP for security
}

variable "ssh_key_name" {
  description = "Name of existing AWS SSH key pair"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "deepseek-ocr"
}

variable "ebs_volume_size" {
  description = "Size of EBS volume in GB for model storage"
  type        = number
  default     = 100
}

variable "token_compression_mode" {
  description = "DeepSeek-OCR token compression mode (tiny, small, base, large, gundam)"
  type        = string
  default     = "base"
}

variable "use_spot_instance" {
  description = "Use spot instance for lower cost (can be interrupted)"
  type        = bool
  default     = false
}

variable "create_elastic_ip" {
  description = "Create an Elastic IP for consistent endpoint URL"
  type        = bool
  default     = true
}

variable "environment" {
  description = "Environment tag (dev, staging, prod)"
  type        = string
  default     = "dev"
}
