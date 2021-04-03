import { Box, Typography, TypographyProps } from "@material-ui/core";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import React from "react";
import { theme } from "theme/theme";
import { VisibilityIcon, VisibilityOffIcon } from "./Icon";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

const styles = () =>
  createStyles({
    root: {
      overflow: "hidden",
    },
    body1: {
      paddingTop: theme.spacing(0.5),
      paddingBottom: theme.spacing(0.5),
    },
    alignCenter: {
      display: "flex",
      justifyContent: "center",
      flex: 1,
    },
  });

interface LabelPropsInterface extends TypographyProps {
  component?: string;
}

type LabelProps = React.Props<any> & WithStyles<typeof styles> & LabelPropsInterface;

const LabelRaw = (props: React.Props<any> & WithStyles<typeof styles> & LabelProps) => {
  return (
    <Typography component={"div"} variant={props.variant} className={props.classes.root} {...props}>
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

export const CardTitle = withStyles(styles)((props: LabelProps) => {
  return <Typography style={{ fontSize: 16, fontWeight: "bold" }}>{props.children}</Typography>;
});
CardTitle.displayName = "CardTitle";

export const Body2 = withStyles(styles)((props: LabelProps) => {
  return (
    <Label variant="body2" {...props}>
      {props.children}
    </Label>
  );
});
Body2.displayName = "Body2";

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

export const CenterTypography = withStyles(styles)((props: LabelProps) => {
  const { classes } = props;
  return (
    <Box className={classes.alignCenter}>
      <Typography>{props.children}</Typography>
    </Box>
  );
});
CenterTypography.displayName = "CenterTypography";

const SecretLabelStyles = () =>
  createStyles({
    root: {
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      maxWidth: "inherit",
    },
    icons: {},
    valueWrapper: {
      paddingLeft: theme.spacing(1),
      maxWidth: "inherit",
      overflowWrap: "inherit",
      paddingRight: 20,
    },
  });

type SecretLabelProps = React.Props<any> & WithStyles<typeof SecretLabelStyles> & TypographyProps;

export const SecretValueLabel = withStyles(SecretLabelStyles)((props: SecretLabelProps) => {
  const { children, classes } = props;
  const [showSecret, setShowSecret] = React.useState(false);

  const handleClick = () => {
    setShowSecret((prev) => !prev);
  };
  const tooltips = showSecret ? "Hide Value" : "Show Value";
  return (
    <Box className={classes.root}>
      <IconButtonWithTooltip tooltipTitle={tooltips} aria-label="show value" onClick={handleClick} edge="end">
        {showSecret ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
      </IconButtonWithTooltip>
      <Box className={classes.valueWrapper}>{showSecret ? children : null}</Box>
    </Box>
  );
});
