import React from "react";
import { action } from "@storybook/addon-actions";
import { boolean } from "@storybook/addon-knobs";
import { DangerButton, ButtonWhite, ButtonGrey, RaisedButton, CustomizedButton } from "widgets/Button";

export default {
  title: "Widgets/Buttons",
  component: CustomizedButton,
};

export const White = () => (
  <ButtonWhite size="small" onClick={action("delete")}>
    White
  </ButtonWhite>
);

export const Grey = () => (
  <ButtonGrey size="small" onClick={action("delete")}>
    White
  </ButtonGrey>
);

export const Raised = () => (
  <RaisedButton size="small" onClick={action("delete")}>
    Raised
  </RaisedButton>
);

export const Danger = () => (
  <DangerButton variant="outlined" size="small" onClick={action("delete")}>
    Delete
  </DangerButton>
);

export const Customized = () => (
  <CustomizedButton
    pending={boolean("pending", false, "CustomizedButton")}
    disabled={boolean("disabled", false, "CustomizedButton")}
    onClick={action("delete")}
  >
    Create new app
  </CustomizedButton>
);
