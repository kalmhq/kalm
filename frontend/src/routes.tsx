import React from "react";
import { Route, Switch } from "react-router";
import { Page404, NoMatch } from "./pages/NoMatch";
import { Dashboard } from "./layout/Dashboard";

import { ApplicationEdit } from "./pages/Application/Edit";
import { ApplicationListPage } from "./pages/Application/List";
import { ApplicationNew } from "./pages/Application/New";
import { ComponentTemplateEdit } from "./pages/ComponentTemplate/Edit";
import { ComponentTemplateListPage } from "./pages/ComponentTemplate/List";
import { ComponentTemplateNew } from "./pages/ComponentTemplate/New";
import { ConfigListPage } from "./pages/Config/List";
import PageDashboard from "./pages/Dashboard";
import { DependencyListPage } from "./pages/Dependency/List";
import { Disks } from "./pages/Disks";
import InstallPage from "./pages/Install";
import { NodeListPage } from "./pages/NodeList";
import { Login } from "./layout/Login";
import { Log } from "./pages/Application/Log";
import { ApplicationShow } from "./pages/Application/Show";

export const KappRoutes = (
  <Switch>
    <Route path="/404" component={Page404} />
    <Route path="/login" component={Login} />
    <Route path="/">
      <Dashboard>
        <Switch>
          <Route exact path="/" component={PageDashboard} />
          <Route exact path="/install" component={InstallPage} />
          <Route exact path="/applications" component={ApplicationListPage} />
          <Route exact path="/applications/:namespace/:applicationName" component={ApplicationShow} />
          <Route exact path="/applications/:namespace/:applicationName/edit" component={ApplicationEdit} />
          <Route exact path="/applications/:namespace/:applicationName/logs" component={Log} />
          <Route exact path="/applications/:namespace/:applicationName/shells" component={Log} />
          <Route exact path="/applications/new" component={ApplicationNew} />
          <Route exact path="/componenttemplates/new" component={ComponentTemplateNew} />
          <Route exact path="/componenttemplates/:componentTemplateName/edit" component={ComponentTemplateEdit}></Route>
          <Route exact path="/componenttemplates" component={ComponentTemplateListPage}></Route>
          <Route exact path="/configs" component={ConfigListPage}></Route>
          <Route exact path="/cluster/nodes" component={NodeListPage}></Route>
          <Route exact path="/cluster/disks" component={Disks}></Route>
          <Route exact path="/settings/dependencies" component={DependencyListPage}></Route>
          <Route component={NoMatch} />
        </Switch>
      </Dashboard>
    </Route>
  </Switch>
);
