# Logs and telemetry. A Log Analytics workspace is where Azure stores logs so you can search
# them. Application Insights collects the API's requests, errors, and traces, and keeps them in
# that workspace. The API sends to it in Phase 8.
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-ohq"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"

  # 30 days is the shortest retention, and it's included in the price.
  retention_in_days = 30

  # The first 5 GB each month are free. Stop collecting for the day after 0.1 GB (about 3 GB a
  # month at most), so a bug that floods the logs can't run up a bill.
  daily_quota_gb = 0.1
}

resource "azurerm_application_insights" "main" {
  name                = "appi-ohq"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"

  # Without this, Azure would create a workspace of its own in another resource group.
  workspace_id = azurerm_log_analytics_workspace.main.id

  # Match the workspace, which is where the data actually lives.
  retention_in_days = 30
}
