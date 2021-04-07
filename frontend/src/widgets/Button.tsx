import {
  Box,
  Button,
  ButtonProps,
  CircularProgress,
  createStyles,
  IconButton,
  Theme,
  useTheme,
  WithStyles,
  withStyles,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import clsx from "clsx";
import React from "react";
import { FormSpy } from "react-final-form";
import { primaryColor } from "theme/theme";
import { AddIcon } from "widgets/Icon";

const customizedButtonStyle = (theme: Theme) => {
  return createStyles({
    root: {
      display: "flex",
      alignItems: "center",
    },
    // text: {
    //   color: theme.palette.text.primary
    // },
    // textPrimary: {
    //   color: theme.palette.primary.main
    // },
    // contained: {
    //   background: "#fff",
    //   color: theme.palette.primary.main,
    //   "&:disabled": {
    //     background: "transparent"
    //   },
    //   "&:hover": {
    //     background: "#fff"
    //   }
    // },
    // containedPrimary: {
    //   background: theme.palette.primary.main,
    //   color: "#fff",
    //   "&:disabled": {
    //     background: "transparent"
    //   },
    //   "&:hover": {
    //     background: theme.palette.primary.main
    //   }
    // }
  });
};

const ButtonWhite = (props: ButtonProps) => {
  return (
    <Box boxShadow={3} m={0} p={0} style={{ width: "fit-content", borderRadius: 5 }}>
      <Button size="small" style={{ paddingLeft: 20, paddingRight: 20 }} color="primary" {...props}>
        {props.children}
      </Button>
    </Box>
  );
};

const ButtonGrey = (props: ButtonProps) => {
  return (
    <Button
      variant="contained"
      size="small"
      style={{ paddingLeft: 20, paddingRight: 20, color: primaryColor }}
      {...props}
    >
      {props.children}
    </Button>
  );
};

type CustomizedButtonProps = ButtonProps &
  WithStyles<typeof customizedButtonStyle> & {
    pending?: boolean;
    to?: string;
    component?: React.ReactNode;
  };

type RaisedButtonProps = ButtonProps & {
  pending?: boolean;
};

export const CustomizedButton = withStyles(customizedButtonStyle)((props: CustomizedButtonProps) => {
  const copiedProps = { ...props };
  delete copiedProps.pending;
  // console.log("pending", props.pending);
  return (
    <Button disabled={props.disabled || props.pending} {...copiedProps}>
      <CircularProgress
        style={{ marginRight: "6px", display: props.pending ? "inline" : "none" }}
        disableShrink={true}
        color="inherit"
        size={14}
      />
      {props.children}
    </Button>
  );
});

type SubmitButtonProps = ButtonProps & {
  pending?: boolean;
};

export const SubmitButton = (props: SubmitButtonProps) => {
  return (
    <FormSpy>
      {({ submitting }) => (
        <CustomizedButton
          pending={submitting}
          disabled={submitting}
          type="submit"
          color="primary"
          variant="contained"
          {...props}
        />
      )}
    </FormSpy>
  );
};

const RaisedButton = (props: RaisedButtonProps) => {
  return (
    <CustomizedButton variant="contained" {...props}>
      {props.children}
    </CustomizedButton>
  );
};

const DangerButtonStyles = (theme: Theme) =>
  makeStyles({
    root: {
      border: `1px solid ${theme.palette.error.main}`,
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.error.main,
    },
    buttonRoot: {
      minWidth: 64,
      color: theme.palette.error.main,
      whiteSpace: "nowrap",
      border: 0,
    },
    text: {
      color: theme.palette.error.main,
      fontWeight: theme.typography.fontWeightBold,
      whiteSpace: "nowrap",
      maxWidth: 0,
      opacity: 0,
      marginLeft: 0,
      transition: theme.transitions.create(["max-width", "opacity", "margin-left"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    textOpen: {
      maxWidth: 100,
      marginLeft: theme.spacing(2),
      opacity: 1,
      transition: theme.transitions.create(["max-width", "opacity", "margin-left"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    show: {
      maxWidth: 200,
      opacity: 1,
      transition: theme.transitions.create(["max-width", "opacity", "min-width", "padding-left"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    hide: {
      maxWidth: 0,
      minWidth: 0,
      opacity: 0,
      pointerEvents: "none",
      paddingLeft: "0 !important",
      transition: theme.transitions.create(["max-width", "opacity", "min-width", "padding-left"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
  });

export const DangerButton = (props: ButtonProps) => {
  const { onClick, style } = props;
  const theme = useTheme();
  const classes = DangerButtonStyles(theme)();

  const [open, setOpen] = React.useState(false);

  const showConfirm = () => {
    if (!open) {
      return setOpen(true);
    }

    return setOpen(false);
  };

  const reset = () => {
    setOpen(false);
  };

  const doDangerAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick && onClick(event);
  };

  return (
    <Box display="inline-block" className={classes.root} style={style}>
      <Box display="inline-block" className={clsx(classes.text, { [classes.textOpen]: open })}>
        Are you sure?
      </Box>

      <Box
        display="inline-block"
        className={clsx({ [classes.show]: open, [classes.hide]: !open })}
        style={{ verticalAlign: "middle", paddingLeft: theme.spacing(1) }}
      >
        <Box display="flex">
          <IconButton aria-label="delete" size="small" onClick={doDangerAction} tabIndex={open ? 1 : -1}>
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="close" size="small" onClick={reset} tabIndex={open ? 2 : -1}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Button
        {...props}
        style={undefined}
        className={clsx(classes.buttonRoot, { [classes.show]: !open, [classes.hide]: open })}
        onClick={showConfirm}
      />
    </Box>
  );
};

/**
 * AddButton is styled to have an "+" sign on the left. Typically used alongside arrays.
 */
export const AddButton = (props: ButtonProps) => {
  return (
    <Button
      variant="outlined"
      color="primary"
      startIcon={<AddIcon />}
      size="small"
      id="add-target-button"
      style={props.style}
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  );
};

/**
 * Identical to AddButton except skinnier. Typically used alongside arrays
 */
export const SkinnyAddButton = (props: ButtonProps) => {
  return (
    <AddButton onClick={props.onClick} style={{ height: 18, borderRadius: 5, fontSize: 12 }}>
      {props.children}
    </AddButton>
  );
};
