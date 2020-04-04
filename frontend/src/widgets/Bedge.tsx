import React from "react";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import { Box, CircularProgress } from "@material-ui/core";
import CancelIcon from "@material-ui/icons/Cancel";
import HelpIcon from "@material-ui/icons/Help";
export const SuccessBedge = (props: { text?: string }) => {
  return (
    <Box display="inline-flex" alignItems="center">
      <CheckCircleIcon style={{ marginRight: 6 }} color="primary" />
      {props.text}
    </Box>
  );
};

export const PendingBedge = (props: { text?: string }) => {
  return (
    <Box display="inline-flex" alignItems="center">
      <CircularProgress
        variant="indeterminate"
        disableShrink
        size={18}
        thickness={4}
        {...props}
        style={{ marginRight: 6 }}
      />
      {props.text}
    </Box>
  );
};

export const ErrorBedge = (props: { text?: string }) => {
  return (
    <Box display="inline-flex" alignItems="center">
      <CancelIcon style={{ marginRight: 6 }} color="secondary" />
      {props.text}
    </Box>
  );
};

export const UnknownBedge = (props: { text?: string }) => {
  return (
    <Box display="inline-flex" alignItems="center">
      <HelpIcon style={{ marginRight: 6 }} color="disabled" />
      {props.text}
    </Box>
  );
};
