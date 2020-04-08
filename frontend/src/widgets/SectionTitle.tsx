import React from "react";
import { Typography, Box } from "@material-ui/core";

export const SectionTitle = (title: string, className: string = "") => (
  <Typography variant="subtitle1" color="textPrimary">
    <Box fontWeight="300" m={1}>
      {title}
    </Box>
  </Typography>
);
