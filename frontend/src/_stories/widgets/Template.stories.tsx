import React from "react";
import { storiesOf } from "@storybook/react";
import { SecretValueLabel } from "widgets/Label";

storiesOf("Widgets/Template", module).add("Short Secure Label", () => {
  return <SecretValueLabel>123123123</SecretValueLabel>;
});
