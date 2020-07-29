const stringConstants = {
  LIMIT_NOT_SET: "Limit Not Set",
  NAME_RULE:
    "Name should only use digits(0-9), lowercase letters(a-z) , underscores(_), periods(.), and be longer than 180 characters.",
  PORT_ROUTE_QUESTION: "Want to have your container accessible to external sources?",
  PORT_ROUTE_ANSWER:
    "Head to the “Routes” section and create a new route for directing external traffic to this container.",
  REPLICA_INPUT_HELPER: "Number of Pods to create for this component.",
  CONFIG_COMMAND_HELPER:
    "Use Config Files to specify file-based configurations for your Component. Config Files created here are automatically mounted to the container.",
  LEARN_MORE_LABEL: "Learn More.",
  ENV_VAR_HELPER:
    "Define environment variables for the main container of this component. This overrides enviornment variables specified in the image.",
  PORTS_HELPER: "To expose your container outside of the pod, you need to open the corresponding ports.",
  DISKS_HELPER: "Specify and mount a disk to your component. There are several ways to mount disks with Kalm.",
  COMMAND_HELPER:
    " Define a command for the main container of this component. This overrides the default Entrypoint and Cmd of the image.",
  COMMAND_INPUT_PLACEHOLDER: "e.g. /bin/sh -c 'echo hello; sleep 600'",

  READINESS_PROBE_HELPER: "Readiness probe is used to decide when a component is ready to accepting traffic.",
  LIVENESS_PROBE_HELPER:
    "Liveness probe is used to know if the component is running into an unexpected state and a restart is required.",

  SCHEDULING_RR_CHECKBOX: "Only schedule on nodes that meet the above resources",
  SCHEDULING_COLOCATE_CHECKBOX: "Prefer to schedule replicas to different nodes. (Recommand for high availablity)",
};

export default stringConstants;
