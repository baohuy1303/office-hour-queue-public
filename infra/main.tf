# Some Azure names must be unique across all of Azure, because they become part of a web address
# (like app-ohq-x7k2qp.azurewebsites.net). Those names end in this random suffix. Terraform keeps
# it in the state, so it stays the same on every apply.
resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}

# One resource group holds everything the app uses, so `terraform destroy` removes all of it.
resource "azurerm_resource_group" "main" {
  name     = "rg-ohq"
  location = var.location
}
