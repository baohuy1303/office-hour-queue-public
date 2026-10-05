# Values Terraform prints after apply. Read one any time with `terraform -chdir=infra output <name>`.

output "web_url" {
  description = "The frontend's address."
  value       = "https://${var.custom_domain}"
}

output "web_default_host" {
  description = "The Static Web App's own hostname. The custom domain's CNAME record points here."
  value       = azurerm_static_web_app.main.default_host_name
}

output "api_url" {
  description = "The API's address."
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "github_deploy_client_id" {
  description = "The id GitHub Actions uses to sign in to Azure as the deploy identity."
  value       = azurerm_user_assigned_identity.github_deploy.client_id
}

output "tenant_id" {
  description = "The Entra ID tenant GitHub Actions signs in to."
  value       = data.azurerm_client_config.current.tenant_id
}

output "subscription_id" {
  description = "The subscription GitHub Actions deploys to."
  value       = data.azurerm_client_config.current.subscription_id
}

output "api_app_name" {
  description = "The API's App Service name, for the deploy workflow."
  value       = azurerm_linux_web_app.api.name
}

output "static_web_app_api_key" {
  description = "The deploy token for the frontend. Whoever has it can replace the site."
  value       = azurerm_static_web_app.main.api_key
  sensitive   = true
}
