package v1alpha1

import "os"

func GetEnvKalmIsInLocalMode() string {
	return os.Getenv(ENV_KALM_IS_IN_LOCAL_MODE)
}

func GetEnvKalmBaseDNSDomain() string {
	return os.Getenv(ENV_KALM_BASE_DNS_DOMAIN)
}

func GetEnvKalmBaseAppDomain() string {
	return os.Getenv(ENV_KALM_BASE_APP_DOMAIN)
}
