terraform {
  required_version = ">= 1.10"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 5.8"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
  }

  # The state file lives in the storage account that bootstrap.sh created. Terraform signs in
  # as you (use_azuread_auth), because that storage account doesn't allow storage keys.
  backend "azurerm" {
    resource_group_name  = "rg-ohq-tfstate"
    storage_account_name = "stohqtfstate32293adf"
    container_name       = "tfstate"
    key                  = "ohq.tfstate"
    use_azuread_auth     = true
  }
}

# Terraform talks to Azure as whoever is signed in to the az CLI.
provider "azurerm" {
  features {
    resource_group {
      # Application Insights makes Azure add a "Smart Detection" action group to the resource
      # group later on. Terraform doesn't track it, so let destroy delete rg-ohq anyway.
      prevent_deletion_if_contains_resources = false
    }
  }

  subscription_id = var.subscription_id

  # A subscription has to register each Azure service before using it. azurerm v5 no longer
  # does that by itself, so list the ones this project uses. The names must match Azure's
  # spelling exactly, and Azure spells microsoft.insights in lowercase.
  resource_provider_registrations = "none"
  resource_providers_to_register = [
    "microsoft.insights",
    "Microsoft.KeyVault",
    "Microsoft.ManagedIdentity",
    "Microsoft.OperationalInsights",
    "Microsoft.Sql",
    "Microsoft.Web",
  ]
}
