import { Button, ButtonClassKey, ButtonProps, createStyles, makeStyles, StandardProps, Theme } from "@material-ui/core";
import React from "react";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      borderRadius: 10,
      fontSize: 14,
      fontWeight: "bold",
    },

    primary: {
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
        color: theme.palette.primary.contrastText,
      },
    },
    secondary: {
      fontWeight: 700,
    },
  }),
);

type ClassKey = ButtonClassKey;

interface ICButton extends StandardProps<ButtonProps, ClassKey> {
  component?: (typeof Link & React.ComponentClass<any, any>) | (typeof Link & React.FunctionComponent<any>);
  to?: any;
}

const CustomButton = ({ children, ...rest }: ICButton) => {
  const classes = useStyles();
  return (
    <Button {...rest} disableElevation variant="contained" className={classes.root}>
      {children}
    </Button>
  );
};

export default CustomButton;
