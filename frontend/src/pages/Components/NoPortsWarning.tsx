import { Box } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";
import React from "react";
import { KTooltip } from "widgets/KTooltip";

const Warning = ({ title, tooltip }: { title: string; tooltip: string }) => {
  return (
    <KTooltip title={tooltip}>
      <Box display={"inline-block"}>
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
      tooltip="If you want to add routes to a Component and handle external traffic requests, you must first expose the corresponding ports."
    />
  );
};
export const NoLivenessProbeWarning = () => {
  return (
    <Warning
      title="No liveness probe"
      tooltip="Liveness probes help detect if problematic containers should be restarted. You can set one up in a Component's `Health` section."
    />
  );
};

export const NoReadinessProbeWarning = () => {
  return (
    <Warning
      title="No readiness probe"
      tooltip="Readiness probes help detect when containers are ready to accept traffic. You can set one up in a Component's `Health` section."
    />
  );
};
