#!/usr/bin/env bash
# Creates the storage that holds Terraform's state file. Run it once, before `terraform init`.
#
# Terraform keeps a record of everything it created, called the state. We keep that file in
# Azure Storage instead of on this laptop, so it can't get lost, and so Terraform can lock it
# (with a lease on the blob) while a plan or apply runs. It gets its own resource group, so
# destroying the app's resources never deletes it.
#
# Running it again is safe: each command leaves what already exists as it is.
set -euo pipefail

LOCATION=centralus
RESOURCE_GROUP=rg-ohq-tfstate
CONTAINER=tfstate

# Storage account names must be globally unique: 3-24 lowercase letters and digits.
# Build one from a hash of the subscription id, so it's the same every time this runs.
SUBSCRIPTION_ID=$(az account show --query id --output tsv)
STORAGE_ACCOUNT="stohqtfstate$(printf '%s' "$SUBSCRIPTION_ID" | sha256sum | cut -c1-8)"

# A new subscription can't create any resource type until its "resource provider" is registered.
echo "Registering the Microsoft.Storage resource provider (this can take a minute)..."
az provider register --namespace Microsoft.Storage --wait

echo "Creating resource group $RESOURCE_GROUP..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# Shared key access is off: nobody can use a storage key. Terraform signs in as you instead.
echo "Creating storage account $STORAGE_ACCOUNT..."
az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --allow-shared-key-access false \
  --output none

# Keep every old version of the state file, so a bad apply can be undone.
echo "Turning on blob versioning..."
az storage account blob-service-properties update \
  --account-name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --enable-versioning true \
  --output none

# container-rm creates the container through Azure Resource Manager, which your Owner role allows.
echo "Creating the $CONTAINER container..."
az storage container-rm create \
  --storage-account "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER" \
  --output none

# Owner manages the account but can't read blobs. Terraform reads and writes the state blob as
# you, so you also need this data role.
echo "Giving you the Storage Blob Data Contributor role on the storage account..."
az role assignment create \
  --assignee "$(az ad signed-in-user show --query id --output tsv)" \
  --role "Storage Blob Data Contributor" \
  --scope "$(az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" --query id --output tsv)" \
  --output none

echo
echo "Done. Terraform's backend settings:"
echo "  resource_group_name  = \"$RESOURCE_GROUP\""
echo "  storage_account_name = \"$STORAGE_ACCOUNT\""
echo "  container_name       = \"$CONTAINER\""
