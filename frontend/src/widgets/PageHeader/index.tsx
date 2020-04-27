import { createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { Breadcrumb } from "../Breadcrumbs";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: "8px 24px 0",
      color: "#039be5",
      minHeight: 40,
      display: "flex",
      justifyContent: "space-between",
      height: "auto",
      alignItems: "center"
    },
    title: {
      fontSize: 20,
      marginTop: 14,
      color: "#039be5",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  });

export interface PageHeaderProps {
  title: string;
  noBreadcrumb?: boolean;
  rightAction?: React.ReactNode;
}

export class PageHeaderRaw extends React.PureComponent<PageHeaderProps & WithStyles<typeof styles>> {
  public render() {
    const { noBreadcrumb, classes, rightAction } = this.props;
    return (
      <div className={classes.root}>
        {noBreadcrumb ? null : <Breadcrumb />}
        {rightAction}
      </div>
    );
  }
}

export const PageHeader = withStyles(styles)(PageHeaderRaw);
