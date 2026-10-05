# Hosting for the ASP.NET Core API and its SignalR hub. An App Service *plan* is the machine
# (size and price). The *web app* is our API running on it. One plan can hold several apps.
resource "azurerm_service_plan" "main" {
  name                = "asp-ohq"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"

  # F1 is free. Change var.app_service_sku to "B1" if 5 WebSockets at once isn't enough.
  sku_name = var.app_service_sku
}

resource "azurerm_linux_web_app" "api" {
  # Becomes https://app-ohq-xxxxxx.azurewebsites.net, so it must be unique.
  name                = "app-ohq-${random_string.suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id

  # Redirect plain http:// requests to https://.
  https_only = true

  # Give the app its own identity in Entra ID, managed by Azure (no password to store or rotate).
  # The API signs in to Key Vault with it.
  identity {
    type = "SystemAssigned"
  }

  site_config {
    # Always On keeps the app loaded between requests, but F1 doesn't allow it. The cost is a
    # slow first request after the app has been idle for a while.
    always_on = var.app_service_sku != "F1"

    # SignalR's best transport. Without it, SignalR falls back to slower long polling.
    websockets_enabled = true

    application_stack {
      dotnet_version = "10.0"
    }

    # No cors block on purpose. App Service's own CORS would override the API's CORS settings,
    # which have to allow credentials for SignalR.
  }

  # These become environment variables. .NET reads them as configuration, and "__" means a
  # nested key, so Cors__AllowedOrigins__0 is the first entry of Cors:AllowedOrigins.
  app_settings = {
    # Where the API loads secrets from (8.1), like ConnectionStrings--Default.
    KeyVaultUri = azurerm_key_vault.main.vault_uri

    # Where the API sends telemetry (8.2). The Azure Monitor package reads this exact name.
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.main.connection_string

    # The frontend may call the API from the browser, at either of its addresses.
    Cors__AllowedOrigins__0 = "https://${azurerm_static_web_app.main.default_host_name}"
    Cors__AllowedOrigins__1 = "https://${var.custom_domain}"
  }
}

# Let the API's identity read secrets from the vault. Read only: it can't change or delete them.
resource "azurerm_role_assignment" "kv_secrets_user_api" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}
