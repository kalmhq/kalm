import { createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { Variant } from "@material-ui/core/styles/createTypography";
import React from "react";
import { Breadcrumb } from "../Breadcrumbs";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(1),
      color: "#039be5",
      minHeight: 40,
      display: "flex",
      justifyContent: "center",
      flexDirection: "column",
      height: "auto"
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
  variant?: Variant;
  onCreate?: () => void;
  createButtonText?: string;
}

export class PageHeaderRaw extends React.PureComponent<PageHeaderProps & WithStyles<typeof styles>> {
  public render() {
    const { noBreadcrumb, classes } = this.props;
    return (
      <div className={classes.root}>
        {noBreadcrumb ? null : <Breadcrumb />}
        {/* <Typography variant={variant ? variant : "h3"} gutterBottom={!noBreadcrumb} className={classes.title}>
          {onCreate ? (
            <Button variant="contained" color="default" disableElevation startIcon={<AddIcon />} onClick={onCreate}>
              {createButtonText || "Add"}
            </Button>
          ) : null}
        </Typography> */}
        {/* <Alert severity="info">
          <Typography>Component is also know as component template.</Typography>
        </Alert> */}
      </div>
    );
  }
}

export const PageHeader = withStyles(styles)(PageHeaderRaw);
