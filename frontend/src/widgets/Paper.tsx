import React from "react";
import { Paper, PaperProps, Theme } from "@material-ui/core";
import { withStyles, createStyles, WithStyles } from "@material-ui/styles";
import { grey } from "@material-ui/core/colors";
import clsx from "clsx";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(1)
    },
    grey1Paper: {
      background: grey[100]
    },
    grey2Paper: {
      background: grey[200]
    },
    grey3Paper: {
      background: grey[300]
    }
  });

type InfoPaperProps = React.Props<any> &
  WithStyles<typeof styles> &
  PaperProps & {
    type?: "light" | "normal" | "dark" | null;
  };
const PaperRaw = (props: InfoPaperProps) => {
  const { classes, type } = props;
  let typeClass;
  switch (type) {
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
    <Paper {...props} className={clsx(props.classes.root, props.className, typeClass)}>
      {props.children}
    </Paper>
  );
};

export const InfoPaper = withStyles(styles)(PaperRaw);

export const LightInfoPaper = withStyles(styles)((props: InfoPaperProps) => {
  return (
    <InfoPaper {...props} type="light">
      {props.children}
    </InfoPaper>
  );
});

export const NormalInfoPaper = withStyles(styles)((props: InfoPaperProps) => {
  return (
    <InfoPaper type="normal" {...props}>
      {props.children}
    </InfoPaper>
  );
});
export const DarkInfoPaper = withStyles(styles)((props: InfoPaperProps) => {
  return (
    <InfoPaper type="dark" {...props}>
      {props.children}
    </InfoPaper>
  );
});
