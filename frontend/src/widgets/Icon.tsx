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
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style}>
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
  const { classes, color, fontSize, style } = props;
  return (
    <SvgIcon className={classes.default} color={color} fontSize={fontSize} style={style} viewBox={"0 0 36 36"}>
      <path d="M16 0.670013C12.8355 0.670013 9.74207 1.6084 7.11088 3.3665C4.4797 5.1246 2.42894 7.62346 1.21793 10.5471C0.0069325 13.4707 -0.309921 16.6878 0.307443 19.7915C0.924806 22.8952 2.44866 25.7461 4.6863 27.9837C6.92394 30.2214 9.77487 31.7452 12.8786 32.3626C15.9823 32.9799 19.1993 32.6631 22.1229 31.4521C25.0466 30.2411 27.5454 28.1903 29.3035 25.5591C31.0616 22.928 32 19.8345 32 16.67C32 12.4265 30.3143 8.35689 27.3137 5.3563C24.3131 2.35572 20.2435 0.670013 16 0.670013ZM11.86 8.92001C12.01 8.7704 12.2132 8.68638 12.425 8.68638C12.6368 8.68638 12.84 8.7704 12.99 8.92001L15.2 11.11V4.93001C15.2 4.71784 15.2843 4.51436 15.4343 4.36433C15.5844 4.2143 15.7878 4.13001 16 4.13001C16.2122 4.13001 16.4157 4.2143 16.5657 4.36433C16.7157 4.51436 16.8 4.71784 16.8 4.93001V11.11L19 8.92001C19.0749 8.84582 19.1636 8.78709 19.2611 8.74719C19.3587 8.70728 19.4631 8.68698 19.5685 8.68745C19.6739 8.68791 19.7782 8.70913 19.8754 8.74989C19.9726 8.79065 20.0608 8.85016 20.135 8.92501C20.2092 8.99987 20.2679 9.0886 20.3078 9.18615C20.3477 9.2837 20.368 9.38815 20.3676 9.49355C20.3671 9.59894 20.3459 9.70321 20.3051 9.80041C20.2644 9.8976 20.2049 9.98582 20.13 10.06L16 14.15L11.86 10.05C11.7104 9.90004 11.6264 9.69685 11.6264 9.48501C11.6264 9.27318 11.7104 9.06999 11.86 8.92001ZM8.32001 20.74C8.17003 20.8896 7.96684 20.9736 7.75501 20.9736C7.54317 20.9736 7.33998 20.8896 7.19001 20.74L3.00001 16.67L7.19001 12.58C7.26351 12.5004 7.3524 12.4366 7.4513 12.3925C7.5502 12.3483 7.65704 12.3246 7.76534 12.323C7.87365 12.3213 7.98116 12.3416 8.08137 12.3828C8.18158 12.4239 8.27239 12.4849 8.3483 12.5622C8.42422 12.6395 8.48365 12.7314 8.52299 12.8323C8.56234 12.9332 8.58078 13.0411 8.5772 13.1493C8.57362 13.2576 8.54809 13.364 8.50216 13.4621C8.45623 13.5602 8.39086 13.6479 8.31001 13.72L6.11001 15.86H12.38C12.5922 15.86 12.7957 15.9443 12.9457 16.0943C13.0957 16.2444 13.18 16.4478 13.18 16.66C13.18 16.8722 13.0957 17.0757 12.9457 17.2257C12.7957 17.3757 12.5922 17.46 12.38 17.46H6.11001L8.31001 19.61C8.46095 19.7587 8.54678 19.9611 8.54865 20.1729C8.55053 20.3848 8.4683 20.5887 8.32001 20.74ZM20.14 24.41C19.99 24.5596 19.7868 24.6436 19.575 24.6436C19.3632 24.6436 19.16 24.5596 19.01 24.41L16.8 22.23V28.4C16.8 28.6122 16.7157 28.8157 16.5657 28.9657C16.4157 29.1157 16.2122 29.2 16 29.2C15.7878 29.2 15.5844 29.1157 15.4343 28.9657C15.2843 28.8157 15.2 28.6122 15.2 28.4V22.23L13 24.42C12.8488 24.5699 12.6443 24.6535 12.4315 24.6526C12.2186 24.6516 12.0149 24.5662 11.865 24.415C11.7152 24.2638 11.6315 24.0593 11.6324 23.8465C11.6334 23.6336 11.7188 23.4299 11.87 23.28L16 19.18L20.14 23.28C20.2896 23.43 20.3736 23.6332 20.3736 23.845C20.3736 24.0569 20.2896 24.26 20.14 24.41ZM24.81 20.75C24.7365 20.8296 24.6476 20.8934 24.5487 20.9376C24.4498 20.9818 24.343 21.0054 24.2347 21.0071C24.1264 21.0087 24.0189 20.9884 23.9186 20.9473C23.8184 20.9061 23.7276 20.8451 23.6517 20.7678C23.5758 20.6905 23.5164 20.5987 23.477 20.4977C23.4377 20.3968 23.4192 20.289 23.4228 20.1807C23.4264 20.0725 23.4519 19.966 23.4979 19.8679C23.5438 19.7698 23.6092 19.6821 23.69 19.61L25.89 17.46H19.63C19.4178 17.46 19.2144 17.3757 19.0643 17.2257C18.9143 17.0757 18.83 16.8722 18.83 16.66C18.83 16.4478 18.9143 16.2444 19.0643 16.0943C19.2144 15.9443 19.4178 15.86 19.63 15.86H25.9L23.7 13.72C23.6192 13.6479 23.5538 13.5602 23.5079 13.4621C23.4619 13.364 23.4364 13.2576 23.4328 13.1493C23.4292 13.0411 23.4477 12.9332 23.487 12.8323C23.5264 12.7314 23.5858 12.6395 23.6617 12.5622C23.7376 12.4849 23.8284 12.4239 23.9286 12.3828C24.0289 12.3416 24.1364 12.3213 24.2447 12.323C24.353 12.3246 24.4598 12.3483 24.5587 12.3925C24.6576 12.4366 24.7465 12.5004 24.82 12.58L29 16.67L24.81 20.75Z" />
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
