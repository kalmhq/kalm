import { createStyles, makeStyles, Theme, useTheme } from "@material-ui/core/styles";
import React from "react";
import { NotificationComponent } from "../../widgets/Notification";
import { TabBarComponent } from "./tabBar";

const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      // display: "flex",
      height: "100%"
    },
    content: {
      flexGrow: 1,
      paddingTop: theme.spacing(1),
      // height: "100%",
      maxWidth: "1200px",
      margin: "0 auto"
    }
  });
});

// const sidebarFoldedKey = "sidebarFoldedKey";

export const Dashboard = (props: React.Props<any>) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  return (
    <div className={classes.root}>
      <NotificationComponent />
      {/* <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} /> */}
      {/* <DrawerComponent open={open} handleDrawerClose={handleDrawerClose} /> */}
      <TabBarComponent />
      <main className={classes.content}>{props.children}</main>
    </div>
  );
};
