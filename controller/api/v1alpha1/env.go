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

func GetEnvKalmClusterIP() string {
	return os.Getenv(ENV_KALM_CLUSTER_IP)
}

func GetEnvCloudflareToken() string {
	return os.Getenv(ENV_CLOUDFLARE_TOKEN)
}

func GetEnvCloudflareDomainToZoneIDConfig() string {
	return os.Getenv(ENV_CLOUDFLARE_DOMAIN_TO_ZONEID_CONFIG)
}

func GetEnvExternalDNSServerIP() string {
	return os.Getenv(ENV_EXTERNAL_DNS_SERVER_IP)
}
