import React from "react";
import { Route, Switch } from "react-router";
import { Page404, NoMatch } from "./pages/NoMatch";
import { Dashboard } from "./layout/Dashboard";

import { ApplicationEdit } from "./pages/Application/Edit";
import { ApplicationList } from "./pages/Application/List";
import { ApplicationNew } from "./pages/Application/New";
import { ComponentTemplateEdit } from "./pages/ComponentTemplate/Edit";
import { ComponentTemplateList } from "./pages/ComponentTemplate/List";
import { ComponentTemplateNew } from "./pages/ComponentTemplate/New";
import ConfigList from "./pages/ConfigList";
import PageDashboard from "./pages/Dashboard";
import { DependencyList } from "./pages/Dependency/List";
import { Disks } from "./pages/Disks";
import InstallPage from "./pages/Install";
import { NodeList } from "./pages/NodeList";
import { Login } from "./layout/Login";

export const KappRoutes = (
  <Switch>
    <Route path="/404" component={Page404} />
    <Route path="/login" component={Login} />
    <Route path="/">
      <Dashboard>
        <Switch>
          <Route exact path="/" component={PageDashboard} />
          <Route exact path="/install" component={InstallPage} />
          <Route exact path="/applications" component={ApplicationList} />
          <Route exact path="/applications/:applicationId/edit" component={ApplicationEdit} />
          <Route exact path="/applications/new" component={ApplicationNew} />
          <Route exact path="/componenttemplates/new" component={ComponentTemplateNew} />
          <Route exact path="/componenttemplates/:componentTemplateId/edit" component={ComponentTemplateEdit}></Route>
          <Route exact path="/componenttemplates" component={ComponentTemplateList}></Route>
          <Route exact path="/configs" component={ConfigList}></Route>
          <Route exact path="/cluster/nodes" component={NodeList}></Route>
          <Route exact path="/cluster/disks" component={Disks}></Route>
          <Route exact path="/settings/dependencies" component={DependencyList}></Route>
          <Route component={NoMatch} />
        </Switch>
      </Dashboard>
    </Route>
  </Switch>
);
