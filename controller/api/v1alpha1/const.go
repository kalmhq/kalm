package v1alpha1

import "fmt"

const (
	KalmEnableLabelName  = "kalm-enabled"
	KalmEnableLabelValue = "true"

	// Event Reason
	ReasonExceedingQuota = "ExceedingQuota"
)

var (
	ExceedingQuotaError    = fmt.Errorf("exceeding quota")
	EvaluatorNotExistError = fmt.Errorf("evaluator not exist")
)
