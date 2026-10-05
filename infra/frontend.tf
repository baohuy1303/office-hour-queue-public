# Hosting for the React frontend. Static Web Apps serves the built files (web/dist) from a global
# CDN with free HTTPS. GitHub Actions uploads them in Phase 9 using this app's deploy token.
resource "azurerm_static_web_app" "main" {
  name                = "stapp-ohq-${random_string.suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  # Free: 100 GB of bandwidth a month and a custom domain, which is far more than we need.
  sku_tier = "Free"
  sku_size = "Free"

  # The deploy workflow records the repo on the app. Don't undo that on every apply.
  lifecycle {
    ignore_changes = [repository_url, repository_branch]
  }
}

# Serves the frontend at var.custom_domain too, with a free HTTPS certificate that Azure renews.
# Azure checks that the domain's CNAME points at this app, so add that DNS record first.
resource "azurerm_static_web_app_custom_domain" "main" {
  static_web_app_id = azurerm_static_web_app.main.id
  domain_name       = var.custom_domain
  validation_type   = "cname-delegation"
}
