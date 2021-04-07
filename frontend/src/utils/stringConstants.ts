/**
 * Put UI strings in this file either to avoid inconsistencies
 * or if you would like for a piece of copy to be reviewed.
 * This flat strings map is probably sufficient for now, but we should
 * replace this with a sophisticated solution if Localization is ever needed.
 */
const StringConstants = {
  APP_NAME: "Kalm",
  LIMIT_NOT_SET: "Limit Not Set",
  REQUEST_NOT_SET: "Request Not Set",
  NAME_RULE: "Names can only use digits(0-9), lowercase letters(a-z), and dashes(-). Maximum length is 63 characters.",
  PORT_ROUTE_QUESTION: "Want to access your application / service with a domain?",
  COMPONENT_TYPE_SERVICE_OPTION: "Default choice - Suitable for most continuous services",
  COMPONENT_TYPE_CRONJOB_OPTION: "Scheduled tasks to be ran at specific times",
  COMPONENT_TYPE_DAEMON_OPTION: "For system services which should be deployed once per node",
  COMPONENT_TYPE_STATEFUL_SET_OPTION: "For stateful apps requiring additional persistence settings",
  PORT_ROUTE_ANSWER:
    "Head to the “Routes” section and create a new route for directing external traffic to this container.",
  IMAGE_INPUT_HELPER: "The image URL defaults to hub.docker.com. Use a full URL for all other registries.",
  IMAGE_PLACEHOLDER: "e.g. nginx:latest",
  REPLICA_INPUT_HELPER: "The number of pods to create for this component.",
  CONFIG_COMMAND_HELPER:
    "Use Config Files to specify file-based configurations for your Component. Config Files created here are automatically mounted to the container.",
  LEARN_MORE_LABEL: "Learn More.",
  ENV_VAR_HELPER:
    "Define environment variables for the main container of this component. This overrides environment variables specified within the image.",
  PORTS_HELPER: "To expose your container outside of its pod, you need to open the corresponding ports.",
  ACCESS_HELPER: "You can protect unwanted external access to this component by checking the box below.",
  DISKS_HELPER: "Specify and mount a disk to your component. There are several ways to mount disks with Kalm.",
  COMMAND_HELPER:
    "Define a command for the main container of this component. This overrides the default Entrypoint and Cmd of the image.",
  COMMAND_INPUT_PLACEHOLDER: "e.g. /bin/sh -c 'echo hello; sleep 600'",

  READINESS_PROBE_HELPER: "Readiness probes are used to determine when a component is ready to accept traffic.",
  LIVENESS_PROBE_HELPER:
    "Liveness probes are used to determine if a component is running into an unexpected state that may require a restart.",
  PROBE_NONE_OPTION: "Remove All Probes",
  PROBE_HTTP_OPTION: "Healthy if the request returns a successful response (status >= 200 and < 400).",
  PROBE_COMMAND_OPTION: "Healthy if the command returns a 0 exit code.",
  PROBE_TCP_OPTION: "Healthy if a TCP connection is successfully established.",
  SCHEDULING_RR_CHECKBOX: "Only schedule on nodes that can provide resources specified above",
  SCHEDULING_COLOCATE_CHECKBOX:
    "Schedule replicas to different nodes when possible. (Recommended for high availablity)",
  CPU_INPUT_PLACEHOLDER: "e.g. 100",
  CPU_INPUT_TOOLTIP: "There are 1000m (milliCPU) in a single CPU. The minimum precision is 1m.",
  MEMORY_INPUT_PLACEHOLDER: "e.g. 256",
  MEMORY_INPUT_TOOLTIP: "Mi is the power-of-two equivalent of a MB. 1 Mi equals 1.05 MB. 1 Gi equals 1024 Mi.",
  DEPLOYMENT_ROLLING: "Replace pods one by one, resulting in zero downtime.",
  DEPLOYMENT_RECREATE:
    "All old pods are stopped and replaced at once, resulting in some downtime. Useful if an application cannot support multiple versions running at the same time.",
  GRACEFUL_TERM_HELPER:
    "When Pods are teriminated, running processes are first asked to gracefully shutdown with SIGTERM. However some applications may not be able to shutdown gracefully. Specify an amount of time to wait before forcefully killing the component with SIGKILL. The default value is 30 seconds. ",
  GRACEFUL_TERM_INPUT_PLACEHOLDER: "e.g. 60",
  ARE_YOU_SURE_PREFIX: "Are you sure you want to delete",
  DELETE_APP_SUBTITLE: "This action is irrevocable, the application will be permanently deleted.",
  CONFIRM_LEAVE_WITHOUT_SAVING: "Are you sure you want to leave without saving changes?",
  EMPTY_APP_TITLE: "To get started, create your first Application",
  EMPTY_APP_SUBTITLE:
    "In Kalm, Applications are the basis of how you organize stuff. One Application represents a set of micro-services which works together to provide functionality. For example, you could use an Application “website”, which is made of multiple components: a web-server, an api-server, and an auth-server.",
  EMPTY_CERT_TITLE: "You don't have any Certificates",
  EMPTY_CERT_SUBTITLE:
    "To enable HTTPS please upload an existing SSL certificate. Alternatively, Kalm can help you setup automatic TLS certification via Let's Encrypt.",
  EMPTY_DOMAIN_TITLE: "You don't have any Domains",
  EMPTY_DOMAIN_SUBTITLE:
    "Kalm has prepared a default domain name for you to use, and you can also use a custom domain name",
  EMPTY_WEBHOOK_TITLE: "To integrate with your pipeline, apply a webhook first.",
  EMPTY_WEBHOOK_SUBTITLE:
    "In Kalm, you can update components through webhooks to achieve continuous deployment. Kalm can be easily integrated with popular CI tools, such as CircleCI and Github Actions.",
  EMPTY_COMPONENTS_TITLE: "This App doesn’t have any Components",
  EMPTY_COMPONENTS_SUBTITLE:
    "Components are the fundamental building blocks of your Application. Each Component corresponds to a single image, and typically represents a service or a cronjob.",
  EMPTY_VOLUME_TITLE: "You don’t have any Disks.",
  EMPTY_VOLUME_SUBTITLE:
    "Disks can be attached to Components to provide persistent storage. Disks can be created in the App Components page, and will show up here automatically.",
  EMPTY_REGISTRY_TITLE: "You haven't added any Private Registries",
  EMPTY_REGISTRY_SUBTITLE:
    "To pull images hosted on a private registry, first add a pull secret here. Public registries such as Docker Hub can be used directly.",
  EMPTY_SSO_TITLE: "You haven't configured Single Sign-On.",
  EMPTY_ROUTES_TITLE: "You don't have any Routes",
  EMPTY_ROUTES_SUBTITLE:
    "Add a Route to allow external requests to access your Application. You can use Routes to specify how hosts and paths map to components, configure HTTPS, and setup canary or blue-green deployments.",
  NEW_APP_BUTTON: "Create App",
  CERT_AUTO: "Automatic Certification with Let's Encrypt",
  CERT_AUTO_DESC:
    "Use a certificate signed by Let's Encrypt. Safe and fast. Renewing and updating are fully-automatic. Wildcard certificate is supported.",
  CERT_UPLOAD: "Use an existing certificate",
  CERT_UPLOAD_DESC: "Use an existing certificate. You are responsible for renewal.",
  CERT_DNS01: "Automatic certification for domains with Let's Encrypt",
  CERT_DNS01_DESC:
    "Use a certificate signed by Let's Encrypt for domains. Safe and fast. Renewing and updating are fully-automatic.",
  CERT_DNS01_SERVER_NOT_READY: "Please config and running ACME DNS Server first.",

  DOMAIN: "You can add custom domains to access your applications.",
  DOMAIN_DESC:
    "After you submit your domain, you will need to follow the coming instructions to configure on your DNS provider side.",

  NODES_INFO_BOX_TEXT:
    "Data and metrics regarding nodes in the cluster is displayed here. For cluster administration operations, please see platform specific instructions.",
  ROUTE_HOSTS_INPUT_HELPER:
    "If you don't have any DNS records pointing to this ip, you can use the ip directly in this field.",
  ROUTE_PATHS_INPUT_HELPER: 'Add paths to be handled. Root("/") added by default. Each path must begin with "/".',
  ROUTE_STRIP_PATH_LABEL: "Strip Path Prefix from request",
  ROUTE_STRIP_PATH_HELPER:
    'Rewrite request so the path is "/". Useful for targets which expects to get requests to root path.',
  ROUTE_HTTP_METHOD_ALL: "All http methods are allowed in this route.",
  ROUTE_HTTP_METHOD_CUSTOM: "Choose allowed methods manually.",
  ROUTE_HTTP_CUSTOM_TITLE: "Choose methods you need",
  ROUTE_HTTPS_ALERT:
    "You choosed https. Please note that the TLS termination will be happened in this route level, which means the targets will receive http requests instead.",
  ROUTE_MULTIPLE_TARGETS_HELPER: "You can add more than one targets, click here to learn more.",
  ROUTE_MULTIPLE_TARGETS_DESC:
    "If you wanna process a A/B test, you can add extra targets and assign weights to them, KALM will automatic distribute requets to different target.",
  WEBHOOK_INFO_BOX_TEXT:
    "You can call webhook directly. In addition, we also provide some out-of-the-box tools to help you connect with commonly used CI tools.",
  DISKS_INFOBOX_BOX1:
    "You don't need to apply disk manually. Disk will be created when you declare authentic disks in component form.",
  HSTS_DOMAINS_REQUIRED_HTTPS: "domains is included on the HSTS preload list, HTTPS is required.",
  APP_THEME_TOOLTIPS: "Toggle light/dark theme",
  APP_TUTORIAL_TOOLTIPS: "Toggle tutorial",
  APP_AUTH_TOOLTIPS: "User settings",
  APP_DASHBOARD_PAGE_NAME: "Dashboard",
  APP_SETTINGS_PAGE_NAME: "Settings",
  APP_MEMBERS_PAGE_NAME: "Members",
  PROTECTED_ENDPOINT_PORT:
    "Select the ports you want to protect. Leaving this field blank will protect all of the ports.",
  PROTECTED_ENDPOINT_SPECIFIC_GROUPS:
    "Enter groups in this field to grant access only to those specified here. Leaving this field blank will grant any member with permissions to view this application the ability to access this component.",
  CANT_NOT_EDIT: "Can NOT edit this field",
  REGISTRY_VERIFIED_ERROR: "Error",
  NO_PERMISSION_TIPS: "No permission to view this, please contact with admin.",
  MOUNT_PATH_PLACEHOLDER: "e.g. /mountPath",
};

export default StringConstants;
