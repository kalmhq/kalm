import { createStyles, Fade, Icon, IconButton, Theme } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.spacing(0, 3),
      background: "#1e2129",
      color: "white",
      ...theme.mixins.toolbar
    },
    title: {
      display: "flex",
      alignItems: "center"
    },
    img: {
      marginRight: 6
    }
  });

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  handleDrawerClose: () => void;
}

const DashboardDrawerTitleRaw = ({ classes, open, handleDrawerClose }: Props) => {
  return (
    <div className={classes.root}>
      <div className={classes.title}>
        <img src={require("../../images/placeholder24x24.png")} className={classes.img} alt="logo" />
        {open ? "Kapp Dashboard" : null}
      </div>

      <Fade in={open}>
        <IconButton onClick={handleDrawerClose} color="inherit">
          <Icon color="inherit">chevron_left_icon</Icon>
        </IconButton>
      </Fade>
    </div>
  );
};

export const DashboardDrawerTitle = withStyles(styles)(DashboardDrawerTitleRaw);
