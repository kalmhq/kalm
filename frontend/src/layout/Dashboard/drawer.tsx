import React from "react";
import clsx from "clsx";
import { Drawer, createStyles, Theme } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import { drawerWidth, sidenavGroups } from "./config";
import ScrollContainer from "../../widgets/ScrollContainer";
import { DashboardDrawerTitle } from "./drawerTitle";
import { Sidenav } from "../../widgets/Sidenav";

const styles = (theme: Theme) =>
  createStyles({
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: "nowrap"
    },
    drawerOpen: {
      width: drawerWidth,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    drawerClose: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      overflowX: "hidden",
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9) + 1
      }
    },
    paper: {
      color: "white",
      backgroundColor: "#2e323d",
      border: 0
    }
  });

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  handleDrawerClose: () => void;
}

const DrawerComponentRaw = ({ classes, open, handleDrawerClose }: Props) => {
  return (
    <Drawer
      variant="permanent"
      className={clsx(classes.drawer, {
        [classes.drawerOpen]: open,
        [classes.drawerClose]: !open
      })}
      classes={{
        paper: clsx({
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open
        })
      }}
      PaperProps={{ className: classes.paper }}>
      <ScrollContainer>
        <DashboardDrawerTitle open={open} handleDrawerClose={handleDrawerClose} />
        <Sidenav groups={sidenavGroups} isFolded={!open} />
      </ScrollContainer>
    </Drawer>
  );
};

export const DrawerComponent = withStyles(styles)(DrawerComponentRaw);
