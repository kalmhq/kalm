import { createStyles, makeStyles, Theme, useTheme } from "@material-ui/core/styles";
import React from "react";
import { Route, Switch } from "react-router-dom";
import { ApplicationEdit } from "../../pages/Application/Edit";
import { ApplicationList } from "../../pages/Application/List";
import { ApplicationNew } from "../../pages/Application/New";
import { ComponentTemplateEdit } from "../../pages/ComponentTemplate/Edit";
import { ComponentTemplateList } from "../../pages/ComponentTemplate/List";
import { ComponentTemplateNew } from "../../pages/ComponentTemplate/New";
import ConfigList from "../../pages/ConfigList";
import Dashboard from "../../pages/Dashboard";
import { DependencyList } from "../../pages/Dependency/List";
import { Disks } from "../../pages/Disks";
import InstallPage from "../../pages/Install";
import { NodeList } from "../../pages/NodeList";
import { NoMatch, Page404 } from "../../pages/NoMatch";
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

export default function MiniDrawer() {
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
    <Switch>
      <Route path="/404" component={Page404} />
      <Route>
        <div className={classes.root}>
          <NotificationComponent />
          <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
          <DrawerComponent open={open} handleDrawerClose={handleDrawerClose} />
          <main className={classes.content}>
            <Switch>
              <Route exact path="/" component={Dashboard} />
              <Route exact path="/install" component={InstallPage} />
              <Route exact path="/applications" component={ApplicationList} />
              <Route exact path="/applications/:applicationId/edit" component={ApplicationEdit} />
              <Route exact path="/applications/new" component={ApplicationNew} />
              <Route exact path="/componenttemplates/new" component={ComponentTemplateNew} />
              <Route
                exact
                path="/componenttemplates/:componentTemplateId/edit"
                component={ComponentTemplateEdit}></Route>
              <Route exact path="/componenttemplates" component={ComponentTemplateList}></Route>
              <Route exact path="/configs" component={ConfigList}></Route>
              <Route exact path="/cluster/nodes" component={NodeList}></Route>
              <Route exact path="/cluster/disks" component={Disks}></Route>
              <Route exact path="/settings/dependencies" component={DependencyList}></Route>
              <Route component={NoMatch} />
            </Switch>
          </main>
        </div>
      </Route>
    </Switch>
  );
}
