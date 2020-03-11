import { AppBar, Box, createStyles, IconButton, Theme, Toolbar, Typography } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import { WithStyles, withStyles } from "@material-ui/styles";
import clsx from "clsx";
import React from "react";
import { HelperSwitch } from "../../widgets/Helper";
import { drawerWidth } from "./config";

const styles = (theme: Theme) =>
  createStyles({
    appBar: {
      zIndex: theme.zIndex.drawer,
      paddingLeft: theme.spacing(9),
      transition: theme.transitions.create(["width", "margin", "padding-left"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      })
    },
    appBarShift: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      paddingLeft: 0,
      transition: theme.transitions.create(["width", "margin", "padding-left"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    menuButton: {
      marginRight: 24
    },
    hide: {
      display: "none"
    }
  });

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  handleDrawerOpen: () => void;
}

const DashboardAppBarRaw = ({ classes, open, handleDrawerOpen }: Props) => {
  return (
    <AppBar
      position="fixed"
      color="default"
      className={clsx(classes.appBar, {
        [classes.appBarShift]: open
      })}>
      <Toolbar>
        <Box display="flex" justifyContent="space-between" alignItems="center" style={{ width: "100%" }}>
          <div>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              className={clsx(classes.menuButton, {
                [classes.hide]: open
              })}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap display="inline">
              **
            </Typography>
          </div>
          <HelperSwitch />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export const DashboardAppBar = withStyles(styles)(DashboardAppBarRaw);
