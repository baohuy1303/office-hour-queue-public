#!/usr/bin/env bash
# Copies Terraform outputs into GitHub, where the deploy workflows read them.
# Run it after `terraform apply`, and again if those outputs ever change (e.g. after a fresh apply).
set -euo pipefail

# Run from infra/, so terraform finds the state and gh finds this repo from its git remote.
cd "$(dirname "$0")"

# Reads one Terraform output. Values are piped to gh, so they never appear in the command line.
out() { terraform output -raw "$1"; }

# Secrets are hidden in logs. The Static Web Apps token is a real secret: it can replace the site.
# The Azure ids aren't secret, but azure/login's docs keep them as secrets, so we do too.
echo "Setting secrets..."
out github_deploy_client_id | gh secret set AZURE_CLIENT_ID
out tenant_id               | gh secret set AZURE_TENANT_ID
out subscription_id         | gh secret set AZURE_SUBSCRIPTION_ID
out static_web_app_api_key  | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN

# Variables are plain settings, readable in logs.
echo "Setting variables..."
gh variable set API_APP_NAME --body "$(out api_app_name)"
gh variable set API_URL      --body "$(out api_url)"

echo "Done. Check them under Settings > Secrets and variables > Actions."
