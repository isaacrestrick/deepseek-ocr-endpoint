resource "aws_security_group" "deepseek_ocr" {
  name        = "${var.project_name}-sg"
  description = "Security group for DeepSeek-OCR inference endpoint"
  vpc_id      = data.aws_vpc.default.id

  tags = {
    Name        = "${var.project_name}-sg"
    Project     = var.project_name
    Environment = var.environment
  }
}

# SSH access
resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.deepseek_ocr.id

  description = "SSH access"
  from_port   = 22
  to_port     = 22
  ip_protocol = "tcp"
  cidr_ipv4   = var.allowed_ips[0]

  tags = {
    Name = "${var.project_name}-ssh"
  }
}

# API access (vLLM)
resource "aws_vpc_security_group_ingress_rule" "api" {
  security_group_id = aws_security_group.deepseek_ocr.id

  description = "vLLM API access"
  from_port   = 8000
  to_port     = 8000
  ip_protocol = "tcp"
  cidr_ipv4   = var.allowed_ips[0]

  tags = {
    Name = "${var.project_name}-api"
  }
}

# Outbound traffic (required for downloading models, packages, etc.)
resource "aws_vpc_security_group_egress_rule" "all_outbound" {
  security_group_id = aws_security_group.deepseek_ocr.id

  description = "Allow all outbound traffic"
  ip_protocol = "-1"
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Name = "${var.project_name}-outbound"
  }
}
