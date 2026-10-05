# The identity GitHub Actions signs in as to deploy the API (Phase 9). No password or key is
# stored in GitHub. Instead, Azure trusts GitHub's own sign-in tokens for pushes to main.

# A user-assigned managed identity is an Entra ID identity we create ourselves, so something
# outside Azure can use it. (The API's identity in api.tf is system-assigned: tied to that app.)
# Using one also means we don't need permission to create app registrations, which some school
# tenants block.
resource "azurerm_user_assigned_identity" "github_deploy" {
  name                = "id-ohq-github"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

# The trust rule. There's no password or key here, only a rule for which GitHub tokens to accept.
# GitHub makes a new token for each workflow run, and it expires within minutes, so every sign-in
# is short-lived. Azure swaps it for an Azure token (about an hour) only if all three values match.
resource "azurerm_federated_identity_credential" "github_main" {
  name                      = "github-main"
  user_assigned_identity_id = azurerm_user_assigned_identity.github_deploy.id
  issuer                    = "https://token.actions.githubusercontent.com" # signed by GitHub
  subject                   = "repo:${var.github_repo}:ref:refs/heads/main" # for a run on main in this repo
  audience                  = ["api://AzureADTokenExchange"]                # meant for Azure
}

# What the identity may do. Website Contributor is a built-in Azure role ("Lets you manage
# websites (not web plans), but not access to them"). It allows:
#   Microsoft.Web/sites/*                           everything on a web app: deploy, restart, settings
#   Microsoft.Web/serverFarms/read, join/action     see a plan and put apps on it, but not resize it
#   Microsoft.Insights/components/*, alertRules/*   Application Insights and alerts
#   Microsoft.Authorization/*/read                  see role assignments, but never grant them
#   plus small extras: read resource groups, run ARM deployments, open support tickets
# The scope below limits all of that to the API's web app. Everywhere else it can do nothing.
resource "azurerm_role_assignment" "github_deploy_website_contributor" {
  scope                = azurerm_linux_web_app.api.id # only this web app
  role_definition_name = "Website Contributor"        # see the list above
  principal_id         = azurerm_user_assigned_identity.github_deploy.principal_id
}
