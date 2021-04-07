import { Paper, PaperProps, Theme } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import clsx from "clsx";
import React from "react";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(1),
    },
    whitePaper: {
      background: "white",
    },
    grey1Paper: {
      background: grey[100],
    },
    grey2Paper: {
      background: grey[200],
    },
    grey3Paper: {
      background: grey[300],
    },
  });

type InfoPaperProps = React.Props<any> &
  WithStyles<typeof styles> &
  PaperProps & {
    paperType?: "light" | "normal" | "dark" | "white" | null;
  };
const PaperRaw = (props: InfoPaperProps) => {
  const { classes, className, paperType, ...otherProps } = props;
  let typeClass;
  switch (paperType) {
    case "white":
      typeClass = classes.whitePaper;
      break;
    case "light":
      typeClass = classes.grey1Paper;
      break;
    case "dark":
      typeClass = classes.grey3Paper;
      break;
    case "normal":
      typeClass = classes.grey2Paper;
      break;
    default:
      typeClass = null;
      break;
  }
  return (
    <Paper {...otherProps} className={clsx(classes.root, className, typeClass)}>
      {props.children}
    </Paper>
  );
};

export const InfoPaper = withStyles(styles)(PaperRaw);
