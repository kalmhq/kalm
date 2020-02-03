import React from "react";
import Typography from "@material-ui/core/Typography";
import { DefaultComponentProps } from "@material-ui/core/OverridableComponent";
import { BasePage } from "../BasePage";

export interface ApplictionListProps {
  children?: React.ReactNode;
  className?: string;
}

export class ApplictionList extends React.PureComponent<ApplictionListProps> {
  public render() {
    return <BasePage title="Application">hehe</BasePage>;
  }
}
