package v1alpha1

import "fmt"

const (
	KalmEnableLabelName  = "kalm-enabled"
	KalmEnableLabelValue = "true"

	// Event Reason
	ReasonExceedingQuota = "ExceedingQuota"
)

// Error
var (
	ExceedingQuotaError    = fmt.Errorf("exceeding quota")
	EvaluatorNotExistError = fmt.Errorf("evaluator not exist")
)

// ENV
const (
	ENV_LETSENCRYPT_ACME_ISSUER_SERVER_URL = "LETSENCRYPT_ACME_ISSUER_SERVER_URL"
	ENV_USE_LETSENCRYPT_PRODUCTION_API     = "USE_LETSENCRYPT_PRODUCTION_API"
)
