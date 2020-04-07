import React from "react";
import { Typography, Box } from "@material-ui/core";

export const TableTitle = (title: string) => (
  <Typography variant="h6" color="primary">
    <Box fontWeight="fontWeightMedium" m={1}>
      {title}
    </Box>
  </Typography>
);
