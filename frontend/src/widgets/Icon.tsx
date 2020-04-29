import React from "react";
import {
  Delete,
  Clear,
  CheckBox,
  Help,
  ArrowDropDown,
  CheckBoxOutlineBlank,
  FilterList,
  CheckCircle,
  Error,
  ArrowBack
} from "@material-ui/icons";
import { withStyles, createStyles, WithStyles } from "@material-ui/styles";
import { grey } from "@material-ui/core/colors";
import { Theme, SvgIconProps } from "@material-ui/core";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(1)
    },
    error: {
      color: theme.palette.error.main
    },
    success: {
      color: theme.palette.success.main
    },
    action: {
      color: theme.palette.primary.main
    },
    disabled: {
      background: grey[300]
    },
    hint: {
      color: grey[700]
    },
    small: {
      fontSize: 12
    }
  });

type IconsProps = WithStyles<typeof styles> & SvgIconProps;

export const HelpIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <Help className={classes.hint} color={color} fontSize={fontSize} />;
});

export const ArrowDropDownIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <ArrowDropDown className={classes.hint} color={color} fontSize={fontSize} />;
});

export const CheckBoxIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <CheckBox className={classes.action} color={color} fontSize={fontSize} />;
});

export const CheckBoxOutlineBlankIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <CheckBoxOutlineBlank className={classes.hint} color={color} fontSize={fontSize} />;
});

export const FilterListIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <FilterList className={classes.hint} color={color} fontSize={fontSize} />;
});

export const ClearIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <Clear className={classes.hint} color={color} fontSize={fontSize} />;
});

export const DeleteIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <Delete className={classes.hint} color={color} fontSize={fontSize} />;
});

export const CheckCircleIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <CheckCircle className={classes.success} color={color} fontSize={fontSize} />;
});

export const ErrorIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <Error className={classes.error} color={color} fontSize={fontSize} />;
});

export const ArrowBackIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <ArrowBack className={classes.action} color={color} fontSize={fontSize} />;
});
