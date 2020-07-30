const stringConstants = {
  LIMIT_NOT_SET: "Limit Not Set",
  REQUEST_NOT_SET: "Request Not Set",
  NAME_RULE: "Names can only use digits(0-9), lowercase letters(a-z), and dashes(-). Maximum length is 180 characters.",
  PORT_ROUTE_QUESTION: "Want to have your container accessible to external sources?",
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
  CONFIRM_LEAVE_WITHOUT_SAVING: "Are you sure you want to leave without saving changes?",
  EMPTY_APP_TITLE: "To get started, create your first Application",
  EMPTY_APP_SUBTITLE:
    "In Kalm, Applications are the basis of how you organize stuff. One Application represents a set of micro-services which works together to provide functionality. For example, you could use an Application “website”, which is made of multiple components: a web-server, an api-server, and an auth-server.",
  EMPTY_CERT_TITLE: "You don't have any Certificates",
  EMPTY_CERT_SUBTITLE:
    "To enable HTTPS please upload an existing SSL certificate. Alternatively, Kalm can help you setup automatic TLS certification via Let's Encrypt.",
  EMPTY_CI_TITLE: "To integrate with your pipeline, apply a deploy key first.",
  EMPTY_CI_SUBTITLE:
    "In Kalm, you can update components through webhooks to achieve continuous deployment. Kalm can be easily integrated with popular CI tools, such as CircleCI and Github Actions.",
  EMPTY_COMPONENTS_TITLE: "This App doesn’t have any Components",
  EMPTY_COMPONENTS_SUBTITLE:
    "Components are the fundamental building blocks of your Application. Each Component corresponds to a single image, and typically represents a service or a cronjob.",
  EMPTY_VOLUME_TITLE: "You don’t have any Disks.",
  EMPTY_VOLUME_SUBTITLE:
    "Disks can be attached to Components to provide persistent storage. Disks can be created in the App Components page, and will show up here automatically.",
  EMPTY_REGISTRY_TITLE: "You haven't configured any Private Registries.",
  EMPTY_REGISTRY_SUBTITLE:
    "To pull images hosted on a private registry, first add an entry with your login info here. Public registries such as Docker Hub can be used directly.",
  EMPTY_ROUTES_TITLE: "You don't have any Routes",
  EMPTY_ROUTES_SUBTITLE:
    "Add a Route to allow external requests to access your Application. You can use Routes to specify how hosts and paths map to components, configure HTTPS, and setup canary or blue-green deployments.",
};

export default stringConstants;
