variable "region" {
  description = "The AWS region"
  default     = "us-east-1"
}

data "aws_region" "current" {}

provider "aws" {
  region  = var.region
}

resource "aws_iam_role" "lambda_ses_role" {
  name = "LambdaSESSendEmailRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ses_full_access" {
  role       = aws_iam_role.lambda_ses_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSESFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_cloudwatch_logs" {
  role       = aws_iam_role.lambda_ses_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "ses_send_email" {
  filename         = "../lambda_function_payload.zip"
  source_code_hash = filebase64sha256("../lambda_function_payload.zip")
  function_name    = "sesSendEmail"
  role             = aws_iam_role.lambda_ses_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"

  environment {
    variables = {
      FROM_EMAIL = "team@madhacks.io"
    }
  }
}

resource "aws_api_gateway_rest_api" "api" {
  name        = "SESSendEmailAPI"
  description = "API to send email via SES"
}

resource "aws_api_gateway_resource" "email_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "send-email"
}

resource "aws_api_gateway_method" "post_email" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.email_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.email_resource.id
  http_method = aws_api_gateway_method.post_email.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.ses_send_email.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ses_send_email.function_name
  principal     = "apigateway.amazonaws.com"
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [
    aws_api_gateway_integration.lambda
  ]

  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "prod"
}

output "api_url" {
  value = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/prod/send-email"
}
