# Key Vault holds the app's secrets. The API reads them at startup with its Managed Identity
# (7.7 and 8.1), so no password ever sits in code, config files, or GitHub.

# Who Terraform is signed in as (you, through the az CLI): your tenant id and user id.
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  # Vault names become a web address (kv-ohq-xxxxxx.vault.azure.net), so they must be unique.
  name                = "kv-ohq-${random_string.suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # Control access with Azure roles (RBAC), the same way as every other resource, instead of
  # the vault's older "access policies".
  rbac_authorization_enabled = true

  # A deleted vault is kept for a while so it can be recovered. 7 days is the shortest.
  # Terraform purges it on destroy, so a fresh apply can reuse the name.
  soft_delete_retention_days = 7
}

# Even the subscription owner can't read or write secrets until given a data role.
# "Secrets Officer" lets you (and Terraform, running as you) manage secrets in this vault only.
resource "azurerm_role_assignment" "kv_secrets_officer_me" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# The API's database connection string. The name uses "--" because Key Vault doesn't allow ":".
# .NET's Key Vault config provider turns "--" back into ":", so the API reads it with
# GetConnectionString("Default"), exactly like the local one in appsettings.Development.json.
resource "azurerm_key_vault_secret" "db_connection" {
  name         = "ConnectionStrings--Default"
  key_vault_id = azurerm_key_vault.main.id
  value = join(";", [
    "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433",
    "Initial Catalog=${azurerm_mssql_database.main.name}",
    "User ID=${azurerm_mssql_server.main.administrator_login}",
    "Password=${random_password.sql_admin.result}",
    "Encrypt=True",
    "TrustServerCertificate=False",
    "Connection Timeout=30",
  ])

  # Terraform can only write the secret after your role exists. A brand-new role can take a
  # minute to work, so if this fails with a 403, wait a minute and apply again.
  depends_on = [azurerm_role_assignment.kv_secrets_officer_me]
}
