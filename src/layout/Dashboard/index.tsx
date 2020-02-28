import { createStyles, makeStyles, Theme, useTheme } from "@material-ui/core/styles";
import React from "react";
import { NotificationComponent } from "../../widgets/Notification";
import { DashboardAppBar } from "./appBar";
import { DrawerComponent } from "./drawer";

const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      display: "flex",
      height: "100%"
    },
    content: {
      flexGrow: 1,
      paddingTop: theme.spacing(8),
      height: "100%"
    }
  });
});

const sidebarFoldedKey = "sidebarFoldedKey";

export const Dashboard = (props: React.Props<any>) => {
  const theme = useTheme();
  const classes = useStyles(theme);
  const [open, setOpen] = React.useState(!window.localStorage.getItem(sidebarFoldedKey));

  const handleDrawerOpen = () => {
    setOpen(true);
    window.localStorage.removeItem(sidebarFoldedKey);
  };

  const handleDrawerClose = () => {
    setOpen(false);
    window.localStorage.setItem(sidebarFoldedKey, "t");
  };

  return (
    <div className={classes.root}>
      <NotificationComponent />
      <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
      <DrawerComponent open={open} handleDrawerClose={handleDrawerClose} />
      <main className={classes.content}>{props.children}</main>
    </div>
  );
};
