# IAM Role for EC2 instance
resource "aws_iam_role" "deepseek_ocr" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-role"
    Project     = var.project_name
    Environment = var.environment
  }
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${var.project_name}-cloudwatch-logs"
  role = aws_iam_role.deepseek_ocr.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.deepseek_ocr.arn}",
          "${aws_cloudwatch_log_group.deepseek_ocr.arn}:*"
        ]
      }
    ]
  })
}

# IAM Policy for CloudWatch Metrics (optional, for monitoring)
resource "aws_iam_role_policy" "cloudwatch_metrics" {
  name = "${var.project_name}-cloudwatch-metrics"
  role = aws_iam_role.deepseek_ocr.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for EC2 self-management (optional, for auto-stop functionality)
resource "aws_iam_role_policy" "ec2_self_management" {
  name = "${var.project_name}-ec2-self-management"
  role = aws_iam_role.deepseek_ocr.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:StopInstances"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Project" = var.project_name
          }
        }
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "deepseek_ocr" {
  name = "${var.project_name}-instance-profile"
  role = aws_iam_role.deepseek_ocr.name

  tags = {
    Name        = "${var.project_name}-instance-profile"
    Project     = var.project_name
    Environment = var.environment
  }
}
