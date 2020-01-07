import React from "react";
import Typography from "@material-ui/core/Typography";
import { DefaultComponentProps } from "@material-ui/core/OverridableComponent";

export interface BasePageProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export class BasePage extends React.PureComponent<BasePageProps> {
  public render() {
    return (
      <div className={this.props.className}>
        <Typography variant="h3" gutterBottom>
          {this.props.title}
        </Typography>
        {this.props.children}
      </div>
    );
  }
}
