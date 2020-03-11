import React from "react";
import { Box } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";

export const Loading = () => (
  <Box display="flex" alignItems="center">
    <CircularProgress size={24} /> <Box ml={1}>Loading</Box>
  </Box>
);
