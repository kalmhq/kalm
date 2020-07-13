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
import Build from "@material-ui/icons/Build";
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
      color: grey[400],
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
  const colorClass = color === "disabled" ? classes.disabled : classes.hint;
  return <Delete className={colorClass} color={color} fontSize={fontSize} style={style} />;
});

export const EditIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  const colorClass = color === "disabled" ? classes.disabled : classes.hint;
  return <Edit className={colorClass} color={color} fontSize={fontSize} style={style} />;
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
      viewBox={"0 0 36 36"}
    >
      <path d="M26.3569 30L30.3604 27.6921L34.3618 25.3832L30.3583 23.0726L26.3569 20.7639V23.3315C25.3761 23.3315 24.2364 23.3315 23.8546 23.3315C22.0342 23.3827 19.7873 21.9502 17.3968 20.1036C16.5057 19.4561 15.6067 18.7437 14.6539 18.1005C15.6067 17.4565 16.5044 16.7449 17.3968 16.0975C19.7873 14.2534 22.0342 12.8183 23.8523 12.8704L26.3569 12.8696V15.4406L30.3583 13.131L34.3618 10.8195L30.3583 8.50558L26.3569 6.19504V8.76444H23.8535C20.1353 8.81648 17.3565 11.0246 14.9249 12.8192C12.511 14.7129 10.3412 16.1385 9.08275 16.0462H1.90405V20.148H9.0851C10.3424 20.0548 12.5133 21.4814 14.927 23.375C17.3576 25.1705 20.1353 27.3768 23.8546 27.4298H26.3569V30Z" />
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

export const KalmIngressIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style} viewBox={"0 0 36 36"}>
      <path d="M11.4781 15.6602C11.8641 16.0245 12.2479 16.4969 12.6418 17.0306C12.6986 16.9489 12.7522 16.8697 12.809 16.7863C13.3791 15.9496 14.0251 15.0023 14.749 14.0856C14.8639 13.9367 14.9845 13.8116 15.1016 13.6711C14.5583 13.0336 13.9591 12.4217 13.2363 11.8956C12.1185 11.0718 10.6582 10.4989 9.03487 10.5108H2V14.5316H9.03615C10.0145 14.5504 10.6348 14.867 11.4781 15.6602ZM26.7217 18.9508V21.4676C25.6931 21.465 23.9885 21.465 23.5055 21.465C22.0775 21.4318 21.1404 20.9765 20.1654 20.1841C19.7437 19.8377 19.3398 19.4035 18.9415 18.9201C18.6425 19.3397 18.3412 19.7729 18.0346 20.2232C17.662 20.7679 17.2781 21.328 16.8777 21.8787C16.7783 22.014 16.6668 22.1536 16.5619 22.2906C18.185 23.9954 20.4365 25.4653 23.4808 25.4832H26.7217V28L30.6431 25.7403L34.5711 23.4754L30.6431 21.2131L26.7217 18.9508ZM20.1654 15.8134C21.1404 15.0193 22.0775 14.5657 23.5055 14.5325C23.9885 14.5325 25.6931 14.5325 26.7217 14.5308V17.0476L30.6431 14.787L34.5711 12.5247L30.6431 10.2606L26.7217 8V10.5142H23.4808C19.8073 10.5364 17.2747 12.6677 15.6259 14.7784C13.9459 16.9114 12.7275 19.161 11.4781 20.3364C10.6335 21.1271 10.0145 21.4471 9.03614 21.465H2V25.4858H9.03614C10.6593 25.4977 12.1196 24.9257 13.2374 24.1001C14.3664 23.2805 15.2143 22.2583 15.975 21.2293C17.4711 19.1567 18.7127 17.0068 20.1654 15.8134Z" />
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
export const CopyIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <FileCopy className={classes.white} color={color} fontSize={fontSize} style={style} />;
});

export const CopyIconDefault = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  return <FileCopy className={classes.default} color={color} fontSize={fontSize} style={style} />;
});

export const WrenchIcon = withStyles(styles)((props: IconsProps) => {
  const { classes, color, fontSize, style } = props;
  const colorClass = color === "disabled" ? classes.disabled : classes.hint;
  return <Build className={colorClass} color={color} fontSize={fontSize} style={style} />;
});
