import { Box } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";
import React from "react";
import { KTooltip } from "forms/Application/KTooltip";

const Warning = ({ title, tooltip }: { title: string; tooltip: string }) => {
  return (
    <KTooltip title={tooltip}>
      <Box color="warning.main" display={"inline-block"}>
        {title}
        <HelpIcon fontSize="small" style={{ verticalAlign: "middle", marginLeft: 4 }} />
      </Box>
    </KTooltip>
  );
};

export const NoPortsWarning = () => {
  return (
    <Warning
      title="No exposed ports"
      tooltip="This means that there is no entrance for traffic to reach this component. This is not a bug, some components do not need to handle external traffic. You can turn off these reminders in the settings."
    />
  );
};
export const NoLivenessProbeWarning = () => {
  return (
    <Warning
      title="No liveness probe"
      tooltip="Sometimes, a component may be running for long periods of time eventually transitions to broken state, and cannot recover except by being restarted. Liveness probes detect and remedy such situations by restarting it."
    />
  );
};

export const NoReadinessProbeWarning = () => {
  return (
    <Warning
      title="No readiness probe"
      tooltip="Sometimes, components are temporarily unable to serve traffic after startup due to some heavy initialized steps. In such cases, you don't want to kill the application, but you don’t want to send it requests either. Readiness probes is to detect and mitigate these situations. Component with failed readiness probe does not receive traffic."
    />
  );
};
