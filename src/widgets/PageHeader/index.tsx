import React from "react";
import styles from "./style.module.css";
import { Typography } from "@material-ui/core";
import { Breadcrumb } from "../Breadcrumbs";
import { Variant } from "@material-ui/core/styles/createTypography";

export interface PageHeaderProps {
  title: string;
  noBreadcrumb: boolean;
  variant?: Variant;
}

export default class PageHeader extends React.PureComponent<PageHeaderProps> {
  public render() {
    const { noBreadcrumb, variant } = this.props;
    return (
      <div className={styles.container}>
        {noBreadcrumb ? null : <Breadcrumb />}
        <Typography
          variant={variant ? variant : "h3"}
          gutterBottom={!noBreadcrumb}
        >
          {this.props.title}
        </Typography>
      </div>
    );
  }
}
