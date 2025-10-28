output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.deepseek_ocr.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.deepseek_ocr.public_ip
}

output "elastic_ip" {
  description = "Elastic IP address (if created)"
  value       = var.create_elastic_ip ? aws_eip.deepseek_ocr[0].public_ip : null
}

output "api_endpoint" {
  description = "vLLM API endpoint URL"
  value       = var.create_elastic_ip ? "http://${aws_eip.deepseek_ocr[0].public_ip}:8000" : "http://${aws_instance.deepseek_ocr.public_ip}:8000"
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = var.create_elastic_ip ? "ssh -i ~/.ssh/${var.ssh_key_name}.pem ubuntu@${aws_eip.deepseek_ocr[0].public_ip}" : "ssh -i ~/.ssh/${var.ssh_key_name}.pem ubuntu@${aws_instance.deepseek_ocr.public_ip}"
}

output "start_instance_command" {
  description = "AWS CLI command to start the instance"
  value       = "aws ec2 start-instances --instance-ids ${aws_instance.deepseek_ocr.id} --region ${var.aws_region}"
}

output "stop_instance_command" {
  description = "AWS CLI command to stop the instance"
  value       = "aws ec2 stop-instances --instance-ids ${aws_instance.deepseek_ocr.id} --region ${var.aws_region}"
}

output "instance_state_command" {
  description = "AWS CLI command to check instance state"
  value       = "aws ec2 describe-instances --instance-ids ${aws_instance.deepseek_ocr.id} --region ${var.aws_region} --query 'Reservations[0].Instances[0].State.Name' --output text"
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group name"
  value       = aws_cloudwatch_log_group.deepseek_ocr.name
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown"
  value = {
    compute_per_hour = var.instance_type == "g4dn.xlarge" ? "$0.526" : "check AWS pricing"
    storage_per_month = format("$%.2f", var.ebs_volume_size * 0.08)
    usage_example = format("2hrs/day × 25 days = ~$%.2f/month compute", 50 * 0.526)
  }
}
