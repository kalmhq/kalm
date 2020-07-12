import React from "react";
import ArrowDropDown from "@material-ui/icons/ArrowDropDown";
import CheckBox from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckCircle from "@material-ui/icons/CheckCircle";
import Clear from "@material-ui/icons/Clear";
import CreateNewFolder from "@material-ui/icons/CreateNewFolder";
import Delete from "@material-ui/icons/Delete";
import Edit from "@material-ui/icons/Edit";
import Error from "@material-ui/icons/Error";
import FileCopy from "@material-ui/icons/FileCopy";
import FilterList from "@material-ui/icons/FilterList";
import Help from "@material-ui/icons/Help";
import NoteAdd from "@material-ui/icons/NoteAdd";
import Publish from "@material-ui/icons/Publish";
import ArrowBack from "@material-ui/icons/ArrowBack";
import SubjectIcon from "@material-ui/icons/Subject";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import { grey } from "@material-ui/core/colors";
import { SvgIcon, SvgIconProps, Theme } from "@material-ui/core";
import { theme } from "theme/theme";
import clsx from "clsx";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(1),
    },
    error: {
      color: theme.palette.error.main,
    },
    success: {
      color: theme.palette.success.main,
    },
    action: {
      color: theme.palette.primary.main,
    },
    disabled: {
      background: grey[300],
    },
    hint: {
      color: grey[700],
    },
    small: {
      fontSize: 12,
    },
    white: {
      color: "white",
    },
    default: {
      color: "rgba(0, 0, 0, 0.54)",
    },
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

export const EditIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <Edit className={classes.hint} color={color} fontSize={fontSize} style={style} />;
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

export const KalmConsoleIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style} viewBox={"0 0 36 36"}>
      <path d="M32,5H4A2,2,0,0,0,2,7V29a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V7A2,2,0,0,0,32,5ZM6.8,15.81V13.17l10,4.59v2.08l-10,4.59V21.78l6.51-3ZM23.4,25.4H17V23h6.4ZM4,9.2V7H32V9.2Z"></path>
    </SvgIcon>
  );
});

export const KalmLogIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <SubjectIcon className={classes.default} color={color} fontSize={fontSize} style={style} />;
});

export const KalmApplicationIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style, className } = props;
  return (
    <SvgIcon className={clsx(classes.default, className)} color={color} fontSize={fontSize} style={style}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 7.33994L16.66 1.68994L22.32 7.33994L16.66 12.9999L11 7.33994ZM11 7.33994V10.9999H3V2.99994H11V7.33994ZM16.66 12.9999H13V20.9999H21V12.9999H16.66ZM11 20.9999H3V12.9999H11V20.9999Z"
      />
    </SvgIcon>
  );
});

export const KalmTemplateIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 5V3H21V5H3ZM3 9H21V7H3V9ZM21 13H3V11H21V13ZM3 17H21V15H3V17ZM3 21H21V19H3V21Z"
      />
    </SvgIcon>
  );
});

export const KalmVolumeIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style} viewBox={"0 0 36 36"}>
      <path d="M30.86,8.43A2,2,0,0,0,28.94,7H7.06A2,2,0,0,0,5.13,8.47L2.29,20H33.71Z"></path>
      <path d="M2,22v7a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V22Zm28,5H26V25h4Z"></path>
    </SvgIcon>
  );
});

export const KalmNodeIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style} viewBox={"0 0 36 36"}>
      <path d="M2,22H34V14H2Zm8-5H24v2H10ZM6,17H8v2H6Z"></path>
      <path d="M32,4H4A2,2,0,0,0,2,6v6H34V6A2,2,0,0,0,32,4ZM8,9H6V7H8ZM24,9H10V7H24Z"></path>
      <path d="M2,30a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V24H2Zm8-3H24v2H10ZM6,27H8v2H6Z"></path>
    </SvgIcon>
  );
});

export const KalmDetailsIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style} viewBox={"0 0 32 24"}>
      <path d="M30 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V22C0 22.5304 0.210714 23.0391 0.585786 23.4142C0.960859 23.7893 1.46957 24 2 24H30C30.5304 24 31.0391 23.7893 31.4142 23.4142C31.7893 23.0391 32 22.5304 32 22V2C32 1.46957 31.7893 0.960859 31.4142 0.585786C31.0391 0.210714 30.5304 0 30 0V0ZM17 16H7C6.73478 16 6.48043 15.8946 6.29289 15.7071C6.10536 15.5196 6 15.2652 6 15C6 14.7348 6.10536 14.4804 6.29289 14.2929C6.48043 14.1054 6.73478 14 7 14H17C17.2652 14 17.5196 14.1054 17.7071 14.2929C17.8946 14.4804 18 14.7348 18 15C18 15.2652 17.8946 15.5196 17.7071 15.7071C17.5196 15.8946 17.2652 16 17 16ZM25 12H7C6.73478 12 6.48043 11.8946 6.29289 11.7071C6.10536 11.5196 6 11.2652 6 11C6 10.7348 6.10536 10.4804 6.29289 10.2929C6.48043 10.1054 6.73478 10 7 10H25C25.2652 10 25.5196 10.1054 25.7071 10.2929C25.8946 10.4804 26 10.7348 26 11C26 11.2652 25.8946 11.5196 25.7071 11.7071C25.5196 11.8946 25.2652 12 25 12ZM25 8H7C6.73478 8 6.48043 7.89464 6.29289 7.70711C6.10536 7.51957 6 7.26522 6 7C6 6.73478 6.10536 6.48043 6.29289 6.29289C6.48043 6.10536 6.73478 6 7 6H25C25.2652 6 25.5196 6.10536 25.7071 6.29289C25.8946 6.48043 26 6.73478 26 7C26 7.26522 25.8946 7.51957 25.7071 7.70711C25.5196 7.89464 25.2652 8 25 8Z" />
    </SvgIcon>
  );
});

export const KalmCertificatesIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style} viewBox={"0 0 36 36"}>
      <path d="M19,30H4a2,2,0,0,1-2-2V8A2,2,0,0,1,4,6H32a2,2,0,0,1,2,2V18.37a8.34,8.34,0,0,0-13.49,9.79l-.93,1.14ZM7,12v1.6H24V12Zm0,5.6H18V16H7Zm0,7H17V23H7Z"></path>
      <path d="M33.83,23.59a6.37,6.37,0,1,0-10.77,4.59l-1.94,2.37.9,3.61,3.66-4.46a6.26,6.26,0,0,0,3.55,0l3.66,4.46.9-3.61-1.94-2.37A6.34,6.34,0,0,0,33.83,23.59Zm-10.74,0a4.37,4.37,0,1,1,4.37,4.31A4.35,4.35,0,0,1,23.1,23.59Z"></path>
    </SvgIcon>
  );
});

export const KalmRegistryIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style} viewBox={"0 0 640 512"}>
      <path d="M349.9 236.3h-66.1v-59.4h66.1v59.4zm0-204.3h-66.1v60.7h66.1V32zm78.2 144.8H362v59.4h66.1v-59.4zm-156.3-72.1h-66.1v60.1h66.1v-60.1zm78.1 0h-66.1v60.1h66.1v-60.1zm276.8 100c-14.4-9.7-47.6-13.2-73.1-8.4-3.3-24-16.7-44.9-41.1-63.7l-14-9.3-9.3 14c-18.4 27.8-23.4 73.6-3.7 103.8-8.7 4.7-25.8 11.1-48.4 10.7H2.4c-8.7 50.8 5.8 116.8 44 162.1 37.1 43.9 92.7 66.2 165.4 66.2 157.4 0 273.9-72.5 328.4-204.2 21.4.4 67.6.1 91.3-45.2 1.5-2.5 6.6-13.2 8.5-17.1l-13.3-8.9zm-511.1-27.9h-66v59.4h66.1v-59.4zm78.1 0h-66.1v59.4h66.1v-59.4zm78.1 0h-66.1v59.4h66.1v-59.4zm-78.1-72.1h-66.1v60.1h66.1v-60.1z" />
    </SvgIcon>
  );
});

export const KalmComponentsIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style} viewBox={"0 0 36 36"}>
      <path d="M33.53,18.76,26.6,15.57V6.43A1,1,0,0,0,26,5.53l-7.5-3.45a1,1,0,0,0-.84,0l-7.5,3.45a1,1,0,0,0-.58.91v9.14L2.68,18.76a1,1,0,0,0-.58.91v9.78h0a1,1,0,0,0,.58.91l7.5,3.45a1,1,0,0,0,.84,0l7.08-3.26,7.08,3.26a1,1,0,0,0,.84,0l7.5-3.45a1,1,0,0,0,.58-.91h0V19.67A1,1,0,0,0,33.53,18.76ZM25.61,22,20.5,19.67l5.11-2.35,5.11,2.35Zm-1-6.44-6.44,3V10.87a1,1,0,0,0,.35-.08L24.6,8v7.58ZM18.1,4.08l5.11,2.35L18.1,8.78,13,6.43ZM10.6,17.31l5.11,2.35L10.6,22,5.49,19.67Zm6.5,11.49-6.5,3h0V24.11h0A1,1,0,0,0,11,24l6.08-2.8Zm15,0-6.46,3V24.11A1,1,0,0,0,26,24l6.08-2.8Z"></path>
    </SvgIcon>
  );
});

export const KalmRoutesIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style, className } = props;
  return (
    <SvgIcon
      className={clsx(classes.default, className)}
      color={color}
      fontSize={fontSize}
      style={style}
      viewBox={"0.161 0.661 31.678 31.678"}
    >
      <path
        d="M 295.883 197.953 C 295.623 197.953 295.373 197.85 295.188 197.665 C 295.006 197.479 294.905 197.229 294.906 196.968 C 294.909 196.707 295.015 196.459 295.201 196.276 L 296.473 195.09 L 291.173 195.091 C 289.909 195.054 288.345 196.053 286.682 197.336 C 286.061 197.786 285.437 198.282 284.774 198.73 C 285.437 199.177 286.062 199.673 286.682 200.123 C 288.345 201.408 289.909 202.405 291.175 202.369 C 291.39 202.369 294.663 202.369 296.261 202.369 L 295.015 201.38 C 294.915 201.292 294.835 201.184 294.778 201.063 C 294.721 200.942 294.69 200.813 294.687 200.678 C 294.681 200.546 294.705 200.413 294.752 200.288 C 294.8 200.164 294.874 200.05 294.968 199.955 C 295.062 199.862 295.171 199.786 295.296 199.736 C 295.419 199.686 295.551 199.659 295.685 199.662 C 295.819 199.664 295.95 199.693 296.071 199.747 C 296.193 199.803 296.301 199.88 296.392 199.979 L 300.692 203.846 L 296.473 207.856 C 296.289 208.041 296.039 208.144 295.778 208.144 C 295.518 208.144 295.268 208.041 295.083 207.856 C 294.901 207.67 294.8 207.42 294.801 207.159 C 294.804 206.898 294.91 206.65 295.096 206.467 L 296.433 205.221 L 291.175 205.221 C 288.587 205.184 286.655 203.649 284.964 202.399 C 283.284 201.082 281.774 200.089 280.899 200.154 L 275.903 200.154 L 275.903 197.3 L 280.897 197.3 C 281.773 197.365 283.283 196.373 284.962 195.055 C 286.654 193.807 288.587 192.27 291.174 192.234 L 296.437 192.234 L 295.12 191.189 C 295.02 191.101 294.94 190.993 294.883 190.872 C 294.826 190.751 294.795 190.622 294.792 190.487 C 294.786 190.355 294.81 190.222 294.857 190.097 C 294.905 189.973 294.979 189.859 295.073 189.764 C 295.167 189.671 295.276 189.595 295.401 189.545 C 295.524 189.495 295.656 189.468 295.79 189.471 C 295.924 189.473 296.055 189.502 296.176 189.556 C 296.298 189.612 296.406 189.689 296.497 189.788 L 300.797 193.655 L 296.578 197.665 C 296.394 197.85 296.144 197.953 295.883 197.953 Z M 287.824 183.097 C 279.076 183.097 271.985 190.188 271.985 198.936 C 271.985 207.684 279.076 214.775 287.824 214.775 C 296.572 214.775 303.663 207.684 303.663 198.936 C 303.663 190.188 296.572 183.097 287.824 183.097 Z"
        transform="matrix(1, 0, 0, 1, -271.824463, -182.435776)"
      />
    </SvgIcon>
  );
});

export const KalmUserIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.white} color={color} fontSize={fontSize} style={style} viewBox={"0 0 36 36"}>
      <path d="M30.61,24.52a17.16,17.16,0,0,0-25.22,0,1.51,1.51,0,0,0-.39,1v6A1.5,1.5,0,0,0,6.5,33h23A1.5,1.5,0,0,0,31,31.5v-6A1.51,1.51,0,0,0,30.61,24.52Z"></path>
      <circle cx="18" cy="10" r="7"></circle>
    </SvgIcon>
  );
});

export const KalmLogoIcon = withStyles(styles)((props: IconsProps) => {
  const { color, fontSize, style, className } = props;
  return (
    <div
      style={{
        background: color ?? theme.palette.grey[700],
        color: "white",
        borderRadius: 4,
        marginLeft: 2,
        marginRight: 8,
        height: fontSize ?? 18,
        width: fontSize ?? 18,
        fontSize: fontSize ?? 12,
        display: "inline-block",
        textAlign: "center",
        ...style,
      }}
      className={className}
    >
      K
    </div>
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
export const CopyIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <FileCopy className={classes.white} color={color} fontSize={fontSize} style={style} />;
});
