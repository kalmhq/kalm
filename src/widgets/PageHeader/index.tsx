import React from "react";
import styles from "./style.module.css";
import { Typography } from "@material-ui/core";
import { Breadcrumb } from "../Breadcrumbs";

export interface PageHeaderProps {
  title: string;
}

export default class PageHeader extends React.PureComponent<PageHeaderProps> {
  public render() {
    return (
      <div className={styles.container}>
        <Breadcrumb />
        <Typography variant="h3" gutterBottom>
          {this.props.title}
        </Typography>
      </div>
    );
  }
}
