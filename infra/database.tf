# The production database. An Azure SQL "server" is just a login endpoint
# (sql-ohq-xxxxxx.database.windows.net). The database inside it is what you pay for.

# Terraform makes up the admin password, so no person ever types or sees it. It's kept in the
# state file (one reason the state lives in locked-down storage), and 7.5 copies it into Key Vault
# as part of the connection string.
resource "random_password" "sql_admin" {
  length      = 32
  min_upper   = 1
  min_lower   = 1
  min_numeric = 1
  min_special = 1

  # Leave out ; = ' " and other characters that would break a connection string.
  override_special = "-_!#%*"
}

resource "azurerm_mssql_server" "main" {
  # Server names become a web address, so they must be unique across Azure.
  name                = "sql-ohq-${random_string.suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  version             = "12.0" # the only version Azure SQL offers; it runs the latest engine

  administrator_login          = "ohqadmin"
  administrator_login_password = random_password.sql_admin.result

  minimum_tls_version = "1.2"
}

resource "azurerm_mssql_database" "main" {
  name      = "sqldb-ohq"
  server_id = azurerm_mssql_server.main.id

  # Basic: 5 DTUs and 2 GB, about $5/month. Plenty for one course's queue.
  sku_name    = "Basic"
  max_size_gb = 2

  # Keep backups in this region only. Geo-redundant backups cost more and we don't need them.
  storage_account_type = "Local"
}

# Let the API on App Service reach the database. The special range 0.0.0.0 to 0.0.0.0 means
# "any Azure service", not "the whole internet". Everything else stays blocked.
resource "azurerm_mssql_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
