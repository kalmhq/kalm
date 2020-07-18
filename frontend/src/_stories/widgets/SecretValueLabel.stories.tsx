import React from "react";
import { storiesOf } from "@storybook/react";
import { SecretValueLabel } from "widgets/Label";
import { Box } from "@material-ui/core";

storiesOf("Widgets/SecretValueLabel", module)
  .add("Short Secure Label", () => {
    return <SecretValueLabel>123123123</SecretValueLabel>;
  })
  .add("Long Secure Label", () => {
    return (
      <Box style={{ maxWidth: 400, overflowWrap: "break-word" }}>
        <SecretValueLabel>
          123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123
        </SecretValueLabel>
      </Box>
    );
  });
