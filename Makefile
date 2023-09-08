LAMBDA_SRC_DIR = ./lambda
LAMBDA_ZIP = ./lambda_function_payload.zip
TERRAFORM_DIR = ./deployment

.PHONY: package-lambda deploy clean

all: package-lambda deploy

package-lambda:
	@echo "Packaging Lambda function..."
	cd $(LAMBDA_SRC_DIR) && zip -r ../lambda_function_payload.zip .

deploy: package-lambda
	@echo "Deploying with Terraform..."
	cd $(TERRAFORM_DIR) && terraform init && terraform apply -auto-approve

clean:
	@echo "Cleaning up..."
	rm -f $(LAMBDA_ZIP)
