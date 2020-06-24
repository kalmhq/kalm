import React from "react";
import { Paper, PaperProps, Theme } from "@material-ui/core";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import { grey } from "@material-ui/core/colors";
import clsx from "clsx";

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

export const WhitePaper = withStyles(styles)((props: InfoPaperProps) => {
  return (
    <InfoPaper {...props} paperType="white">
      {props.children}
    </InfoPaper>
  );
});

export const LightInfoPaper = withStyles(styles)((props: InfoPaperProps) => {
  return (
    <InfoPaper {...props} paperType="light">
      {props.children}
    </InfoPaper>
  );
});

export const NormalInfoPaper = withStyles(styles)((props: InfoPaperProps) => {
  return (
    <InfoPaper paperType="normal" {...props}>
      {props.children}
    </InfoPaper>
  );
});
export const DarkInfoPaper = withStyles(styles)((props: InfoPaperProps) => {
  return (
    <InfoPaper paperType="dark" {...props}>
      {props.children}
    </InfoPaper>
  );
});
