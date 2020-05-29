import React from "react";
import { Typography, TypographyProps, Box } from "@material-ui/core";
import { withStyles, createStyles, WithStyles } from "@material-ui/styles";
import { theme } from "theme";

const styles = () =>
  createStyles({
    root: {
      overflow: "hidden"
    },
    body1: {
      paddingTop: theme.spacing(1)
    }
  });

type LabelProps = React.Props<any> & WithStyles<typeof styles> & TypographyProps;
const LabelRaw = (props: LabelProps) => {
  return (
    <Typography variant={props.variant} className={props.classes.root} {...props}>
      {props.children}
    </Typography>
  );
};

export const Label = withStyles(styles)(LabelRaw);

export const H1 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h1" {...props}>
      {props.children}
    </Label>
  );
});

export const H2 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h2" {...props}>
      {props.children}
    </Label>
  );
});

export const H3 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h3" {...props}>
      {props.children}
    </Label>
  );
});

export const H4 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h4" {...props}>
      {props.children}
    </Label>
  );
});

export const H5 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h5" {...props}>
      {props.children}
    </Label>
  );
});

export const H6 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h6" {...props}>
      {props.children}
    </Label>
  );
});

export const Subtitle1 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="subtitle1" {...props}>
      {props.children}
    </Label>
  );
});

export const Subtitle2 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="subtitle2" {...props}>
      {props.children}
    </Label>
  );
});

export const Body = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="body1" {...props}>
      {props.children}
    </Label>
  );
});

export const BoldBody = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="body2" {...props}>
      {props.children}
    </Label>
  );
});

export const Caption = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="caption" {...props}>
      {props.children}
    </Label>
  );
});

export const CenterCaption = withStyles(styles)((props: LabelProps) => {
  return (
    <Box style={{ display: "flex", justifyContent: "center" }}>
      <Caption>{props.children}</Caption>
    </Box>
  );
});
