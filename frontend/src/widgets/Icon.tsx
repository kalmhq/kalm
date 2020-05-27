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
  const { classes, color, fontSize, style } = props;
  return <Help className={classes.hint} color={color} fontSize={fontSize} style={style} />;
});

export const ArrowDropDownIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <ArrowDropDown className={classes.hint} color={color} fontSize={fontSize} style={style} />;
});

export const CheckBoxIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <CheckBox className={classes.action} color={color} fontSize={fontSize} style={style} />;
});

export const CheckBoxOutlineBlankIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <CheckBoxOutlineBlank className={classes.hint} color={color} fontSize={fontSize} style={style} />;
});

export const FilterListIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <FilterList className={classes.hint} color={color} fontSize={fontSize} style={style} />;
});

export const ClearIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <Clear className={classes.hint} color={color} fontSize={fontSize} style={style} />;
});

export const DeleteIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <Delete className={classes.hint} color={color} fontSize={fontSize} style={style} />;
});

export const CheckCircleIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <CheckCircle className={classes.success} color={color} fontSize={fontSize} style={style} />;
});

export const ErrorIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <Error className={classes.error} color={color} fontSize={fontSize} style={style} />;
});

export const ArrowBackIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <ArrowBack className={classes.action} color={color} fontSize={fontSize} style={style} />;
});

export const KappConsoleIcon = withStyles(styles)((props: IconsProps) => {
  const { color, fontSize, style } = props;
  return (
    <SvgIcon color={color} fontSize={fontSize} style={style}>
      <path d="m20 19v-12h-16v12zm0-16c.5304 0 1.0391.21071 1.4142.58579.3751.37507.5858.88378.5858 1.41421v14c0 .5304-.2107 1.0391-.5858 1.4142s-.8838.5858-1.4142.5858h-16c-.53043 0-1.03914-.2107-1.41421-.5858-.37508-.3751-.58579-.8838-.58579-1.4142v-14c0-.53043.21071-1.03914.58579-1.41421.37507-.37508.88378-.58579 1.41421-.58579zm-7 14v-2h5v2zm-3.42-4-4.01-4h2.83l3.3 3.3c.39.39.39 1.03 0 1.42l-3.28 3.28h-2.83z" />
    </SvgIcon>
  );
});

export const KappLogIcon = withStyles(styles)((props: IconsProps) => {
  const { color, fontSize, style } = props;
  return (
    <SvgIcon color={color} fontSize={fontSize} style={style}>
      <path d="M18 7C16.9 7 16 7.9 16 9V15C16 16.1 16.9 17 18 17H20C21.1 17 22 16.1 22 15V11H20V15H18V9H22V7H18ZM2 7V17H8V15H4V7H2ZM11 7C9.9 7 9 7.9 9 9V15C9 16.1 9.9 17 11 17H13C14.1 17 15 16.1 15 15V9C15 7.9 14.1 7 13 7H11ZM11 9H13V15H11V9Z" />
    </SvgIcon>
  );
});

export const KappApplicationIcon = withStyles(styles)((props: IconsProps) => {
  const { color, fontSize, style } = props;
  return (
    <SvgIcon color={color} fontSize={fontSize} style={style}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 7.33994L16.66 1.68994L22.32 7.33994L16.66 12.9999L11 7.33994ZM11 7.33994V10.9999H3V2.99994H11V7.33994ZM16.66 12.9999H13V20.9999H21V12.9999H16.66ZM11 20.9999H3V12.9999H11V20.9999Z"
        fill="black"
        fillOpacity="0.54"
      />
    </SvgIcon>
  );
});

export const KappTemplateIcon = withStyles(styles)((props: IconsProps) => {
  const { color, fontSize, style } = props;
  return (
    <SvgIcon color={color} fontSize={fontSize} style={style}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 5V3H21V5H3ZM3 9H21V7H3V9ZM21 13H3V11H21V13ZM3 17H21V15H3V17ZM3 21H21V19H3V21Z"
        fill="black"
        fillOpacity="0.54"
      />
    </SvgIcon>
  );
});

export const KappVolumeIcon = withStyles(styles)((props: IconsProps) => {
  const { color, fontSize, style } = props;
  return (
    <SvgIcon color={color} fontSize={fontSize} style={style}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM12 19C10.34 19 9 17.66 9 16C9 14.34 10.34 13 12 13C13.66 13 15 14.34 15 16C15 17.66 13.66 19 12 19ZM5 9H15V5H5V9Z"
        fill="black"
        fillOpacity="0.54"
      />
    </SvgIcon>
  );
});

export const KappNodeIcon = withStyles(styles)((props: IconsProps) => {
  const { color, fontSize, style } = props;
  return (
    <SvgIcon color={color} fontSize={fontSize} style={style}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.36 10.27L12 16L4.63 10.27L3 9L12 2L21 9L19.36 10.27ZM4.62 12.81L11.99 18.54L19.37 12.8L21 14.07L12 21.07L3 14.07L4.62 12.81Z"
        fill="black"
        fillOpacity="0.54"
      />
    </SvgIcon>
  );
});

export const AddFileIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <NoteAdd className={classes.white} color={color} fontSize={fontSize} style={style} />;
});

export const AddFolderIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <CreateNewFolder className={classes.white} color={color} fontSize={fontSize} style={style} />;
});
export const UploadIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <Publish className={classes.white} color={color} fontSize={fontSize} style={style} />;
});
export const EditIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <Edit className={classes.white} color={color} fontSize={fontSize} style={style} />;
});
export const CopyIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <FileCopy className={classes.white} color={color} fontSize={fontSize} style={style} />;
});
export const DeleteWhiteIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <Delete className={classes.white} color={color} fontSize={fontSize} style={style} />;
});
