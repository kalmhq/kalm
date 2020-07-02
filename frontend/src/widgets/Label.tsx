import { Box, Typography, TypographyProps } from "@material-ui/core";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import React from "react";
import { theme } from "theme/theme";

const styles = () =>
  createStyles({
    root: {
      overflow: "hidden",
    },
    body1: {
      paddingTop: theme.spacing(1),
    },
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
H1.displayName = "H1";

export const H2 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h2" {...props}>
      {props.children}
    </Label>
  );
});
H2.displayName = "H2";

export const H3 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h3" {...props}>
      {props.children}
    </Label>
  );
});
H3.displayName = "H3";

export const H4 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h4" {...props}>
      {props.children}
    </Label>
  );
});
H4.displayName = "H4";

export const H5 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h5" {...props}>
      {props.children}
    </Label>
  );
});
H5.displayName = "H5";

export const H6 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="h6" {...props}>
      {props.children}
    </Label>
  );
});
H6.displayName = "H6";

export const Subtitle1 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="subtitle1" {...props}>
      {props.children}
    </Label>
  );
});
Subtitle1.displayName = "Subtitle1";

export const Subtitle2 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="subtitle2" {...props}>
      {props.children}
    </Label>
  );
});
Subtitle2.displayName = "Subtitle2";

export const Body = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="body1" {...props}>
      {props.children}
    </Label>
  );
});
Body.displayName = "Body";

export const BoldBody = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="body2" {...props}>
      {props.children}
    </Label>
  );
});
BoldBody.displayName = "BoldBody";

export const Caption = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="caption" {...props}>
      {props.children}
    </Label>
  );
});
Caption.displayName = "Caption";

export const CenterCaption = withStyles(styles)((props: LabelProps) => {
  return (
    <Box style={{ display: "flex", justifyContent: "center" }}>
      <Caption>{props.children}</Caption>
    </Box>
  );
});
CenterCaption.displayName = "CenterCaption";
