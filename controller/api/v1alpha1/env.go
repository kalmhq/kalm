package v1alpha1

import "os"

func GetKalmLocalModeFromEnv() string {
	return os.Getenv(ENV_KALM_IS_IN_LOCAL_MODE)
}

func GetKalmBaseDomainFromEnv() string {
	return os.Getenv(ENV_KALM_CLUSTER_BASE_DOMAIN)
}
