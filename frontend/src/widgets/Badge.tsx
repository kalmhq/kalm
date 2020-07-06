import React from "react";
import { Box, CircularProgress } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";
import WarningIcon from "@material-ui/icons/Warning";
import { CheckCircleIcon, ErrorIcon } from "./Icon";

const Spacer = () => {
  return <Box style={{ width: 4 }} />;
};

export const SuccessBadge = (props: { text?: string }) => {
  return (
    <Box display="inline-flex" alignItems="center">
      <CheckCircleIcon />
      {props.text && <Spacer />}
      {props.text}
    </Box>
  );
};

export const PendingBadge = (props: { text?: string }) => {
  return (
    <Box display="inline-flex" alignItems="center">
      <CircularProgress variant="indeterminate" disableShrink size={18} thickness={4} {...props} />
      {props.text && <Spacer />}
      {props.text}
    </Box>
  );
};

export const WarningBadge = (props: { text?: string }) => {
  return (
    <Box display="inline-flex" alignItems="center">
      <WarningIcon color="secondary" />
      {props.text && <Spacer />}
      {props.text}
    </Box>
  );
};

export const ErrorBadge = (props: { text?: string }) => {
  return (
    <Box display="inline-flex" alignItems="center">
      <ErrorIcon />
      {props.text && <Spacer />}
      {props.text}
    </Box>
  );
};

export const UnknownBadge = (props: { text?: string }) => {
  return (
    <Box display="inline-flex" alignItems="center">
      <HelpIcon color="disabled" />
      {props.text && <Spacer />}
      {props.text}
    </Box>
  );
};
