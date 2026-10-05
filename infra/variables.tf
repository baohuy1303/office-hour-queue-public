variable "subscription_id" {
  description = "Your Azure subscription id. It goes in terraform.tfvars, which git ignores."
  type        = string
}

variable "location" {
  description = "Azure region for everything. Central US is the only region your Azure for Students subscription allows that also has Static Web Apps."
  type        = string
  default     = "centralus"
}

variable "app_service_sku" {
  description = "The API's App Service plan. F1 is free but allows only 5 WebSockets at once. B1 allows 350 and costs about $13/month."
  type        = string
  default     = "F1"
}

variable "github_repo" {
  description = "The GitHub repo whose pushes to main may deploy, as GitHub's tokens name it: owner@ownerId/name@repoId."
  type        = string
  default     = "baohuy1303@191438810/office-hour-queue@1389764991"
}

variable "custom_domain" {
  description = "The frontend's own address. Its CNAME record must point at the Static Web App before apply."
  type        = string
  default     = "ohq.hbhuy.me"
}
