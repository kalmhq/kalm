package v1alpha1

import "os"

func GetEnvPhysicalClusterID() string {
	return os.Getenv(ENV_KALM_PHYSICAL_CLUSTER_ID)
}

func GetEnvKalmMode() string {
	return os.Getenv(ENV_KALM_MODE)
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
