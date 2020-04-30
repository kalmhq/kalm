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
  ArrowBack,
  NoteAdd,
  CreateNewFolder,
  Publish,
  Edit,
  FileCopy
} from "@material-ui/icons";
import { withStyles, createStyles, WithStyles } from "@material-ui/styles";
import { grey } from "@material-ui/core/colors";
import { Theme, SvgIconProps, SvgIcon } from "@material-ui/core";

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
    },
    white: {
      color: "white"
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

export const ConsoleIcon = withStyles(styles)((props: IconsProps) => {
  const { color, fontSize } = props;
  return (
    <SvgIcon color={color} fontSize={fontSize}>
      <path d="m20 19v-12h-16v12zm0-16c.5304 0 1.0391.21071 1.4142.58579.3751.37507.5858.88378.5858 1.41421v14c0 .5304-.2107 1.0391-.5858 1.4142s-.8838.5858-1.4142.5858h-16c-.53043 0-1.03914-.2107-1.41421-.5858-.37508-.3751-.58579-.8838-.58579-1.4142v-14c0-.53043.21071-1.03914.58579-1.41421.37507-.37508.88378-.58579 1.41421-.58579zm-7 14v-2h5v2zm-3.42-4-4.01-4h2.83l3.3 3.3c.39.39.39 1.03 0 1.42l-3.28 3.28h-2.83z" />
    </SvgIcon>
  );
});

export const LogIcon = withStyles(styles)((props: IconsProps) => {
  const { color, fontSize } = props;
  return (
    <SvgIcon color={color} fontSize={fontSize}>
      <path d="M18 7C16.9 7 16 7.9 16 9V15C16 16.1 16.9 17 18 17H20C21.1 17 22 16.1 22 15V11H20V15H18V9H22V7H18ZM2 7V17H8V15H4V7H2ZM11 7C9.9 7 9 7.9 9 9V15C9 16.1 9.9 17 11 17H13C14.1 17 15 16.1 15 15V9C15 7.9 14.1 7 13 7H11ZM11 9H13V15H11V9Z" />
    </SvgIcon>
  );
});

export const AddFileIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <NoteAdd className={classes.white} color={color} fontSize={fontSize} />;
});

export const AddFolderIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <CreateNewFolder className={classes.white} color={color} fontSize={fontSize} />;
});
export const UploadIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <Publish className={classes.white} color={color} fontSize={fontSize} />;
});
export const EditIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <Edit className={classes.white} color={color} fontSize={fontSize} />;
});
export const CopyIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <FileCopy className={classes.white} color={color} fontSize={fontSize} />;
});
export const DeleteWhiteIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize } = props;
  return <Delete className={classes.white} color={color} fontSize={fontSize} />;
});
