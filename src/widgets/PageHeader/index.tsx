import {
  Button,
  createStyles,
  Theme,
  Typography,
  WithStyles,
  withStyles
} from "@material-ui/core";
import { Variant } from "@material-ui/core/styles/createTypography";
import AddIcon from "@material-ui/icons/Add";
import React from "react";
import { Breadcrumb } from "../Breadcrumbs";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3),
      color: "white",
      minHeight: 160,
      backgroundColor: "#039be5",
      display: "flex",
      justifyContent: "center",
      flexDirection: "column"
    },
    title: {
      fontSize: 20,
      marginTop: 14,
      color: "white",
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

export class PageHeaderRaw extends React.PureComponent<
  PageHeaderProps & WithStyles<typeof styles>
> {
  public render() {
    const {
      noBreadcrumb,
      variant,
      classes,
      onCreate,
      createButtonText
    } = this.props;
    return (
      <div className={classes.root}>
        {noBreadcrumb ? null : <Breadcrumb />}
        <Typography
          variant={variant ? variant : "h3"}
          gutterBottom={!noBreadcrumb}
          className={classes.title}
        >
          {this.props.title}
          {onCreate ? (
            <Button
              variant="contained"
              color="default"
              disableElevation
              startIcon={<AddIcon />}
              onClick={onCreate}
            >
              {createButtonText || "Add"}
            </Button>
          ) : null}
        </Typography>
        {/* <Alert severity="info">
          <Typography>Component is also know as component template.</Typography>
        </Alert> */}
      </div>
    );
  }
}

export const PageHeader = withStyles(styles)(PageHeaderRaw);
