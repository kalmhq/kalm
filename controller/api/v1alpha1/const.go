package v1alpha1

import "fmt"

const (
	KalmEnableLabelName  = "kalm-enabled"
	KalmEnableLabelValue = "true"

	// Event Reason
	ReasonExceedingQuota = "ExceedingQuota"
	ReasonReschedule     = "ReSchedule"

	// Tenant
	// currently system tenant and global tenant sharing same name: global
	// maybe separate names are better
	//   systemTenant used for kalm-system
	//   globalTenant used for local mode user workload
	DefaultSystemTenantName = "global"
	DefaultGlobalTenantName = "global"

	ACMEServerName = "acme-server"
)

type KalmMode string

var (
	KalmModeCloud KalmMode = "cloud"
	KalmModeLocal KalmMode = "local"
	KalmModeBYOC  KalmMode = "byoc" // Bring Your Own Cluster
)

// Error
var (
	ExceedingQuotaError    = fmt.Errorf("exceeding quota")
	EvaluatorNotExistError = fmt.Errorf("evaluator not exist")
)

// ENV
const (
	// let's encrypt
	ENV_LETSENCRYPT_ACME_ISSUER_SERVER_URL = "LETSENCRYPT_ACME_ISSUER_SERVER_URL"
	ENV_USE_LETSENCRYPT_PRODUCTION_API     = "USE_LETSENCRYPT_PRODUCTION_API"

	// kalm mode
	ENV_KALM_MODE = "KALM_MODE"

	ENV_KALM_PHYSICAL_CLUSTER_ID = "ENV_KALM_PHYSICAL_CLUSTER_ID"

	ENV_KALM_BASE_DNS_DOMAIN               = "KALM_BASE_DNS_DOMAIN"
	ENV_KALM_BASE_APP_DOMAIN               = "KALM_BASE_APP_DOMAIN"
	ENV_KALM_CLUSTER_IP                    = "KALM_CLUSTER_IP"
	ENV_CLOUDFLARE_TOKEN                   = "CLOUDFLARE_TOKEN"
	ENV_CLOUDFLARE_DOMAIN_TO_ZONEID_CONFIG = "CLOUDFLARE_DOMAIN_TO_ZONEID_CONFIG"

	ENV_EXTERNAL_DNS_SERVER_IP = "EXTERNAL_DNS_SERVER_IP"

	ENV_KALM_CLUSTER_NAME = "KALM_CLUSTER_NAME"

	// auth-proxy
	ENV_NEED_EXTRA_OAUTH_SCOPE = "NEED_EXTRA_OAUTH_SCOPE"
)
