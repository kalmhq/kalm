import { createStyles, makeStyles, Theme, useTheme } from "@material-ui/core/styles";
import React from "react";
import { AuthWrapper } from "./AuthWrapper";
import { TabBarComponent } from "./TabBar";

const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      // display: "flex",
      height: "100%"
    },
    content: {
      flexGrow: 1,
      paddingTop: "128px",
      // height: "100%",
      // maxWidth: "1200px",
      margin: "0 auto"
    }
  });
});

// const sidebarFoldedKey = "sidebarFoldedKey";
export const tabOptions = [
  {
    text: "Namespaces",
    to: "/admin/namespaces"
  },
  {
    text: "Roles & Permissions",
    to: "/admin/roles"
  },
  {
    text: "Dependencies",
    to: "/admin/dependencies"
  }
];

export const Admin = AuthWrapper((props: React.Props<any>) => {
  const theme = useTheme();
  const classes = useStyles(theme);

  return (
    <div className={classes.root}>
      {/* <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} /> */}
      {/* <DrawerComponent open={open} handleDrawerClose={handleDrawerClose} /> */}
      <TabBarComponent tabOptions={tabOptions} title="Kapp Admin Panel" isAdmin />
      <main className={classes.content}>{props.children}</main>
    </div>
  );
});
