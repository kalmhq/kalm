import { Dashboard } from "layout/Dashboard";
import { Login } from "layout/Login";
import { ApplicationEdit } from "pages/Application/Edit";
import { ApplicationListPage } from "pages/Application/List";
import { Log } from "pages/Application/Log";
import { ApplicationNew } from "pages/Application/New";
import { ApplicationShow } from "pages/Application/Show";
import { ComponentTemplateEdit } from "pages/ComponentTemplate/Edit";
import { ComponentTemplateListPage } from "pages/ComponentTemplate/List";
import { ComponentTemplateNew } from "pages/ComponentTemplate/New";
import { ConfigListPage } from "pages/Config/List";
import { DependencyListPage } from "pages/Dependency/List";
import { Disks } from "pages/Disks";
import InstallPage from "pages/Install";
import { NamespacesPage } from "pages/Namespace";
import { NodeListPage } from "pages/NodeList";
import { NoMatch, Page404 } from "pages/NoMatch";
import { RolesPage } from "pages/Roles";
import React from "react";
import { Route, Switch } from "react-router";

export const KappRoutes = (
  <Switch>
    <Route path="/404" component={Page404} />
    <Route path="/login" component={Login} />
    <Route path="/">
      <Dashboard>
        <Switch>
          <Route exact path={["/", "/namespaces"]} component={NamespacesPage} />
          <Route exact path="/roles" component={RolesPage} />

          <Route exact path="/install" component={InstallPage} />
          <Route exact path="/componenttemplates/new" component={ComponentTemplateNew} />
          <Route exact path="/componenttemplates/:componentTemplateName/edit" component={ComponentTemplateEdit}></Route>
          <Route exact path="/componenttemplates" component={ComponentTemplateListPage}></Route>
          <Route exact path="/cluster/nodes" component={NodeListPage}></Route>
          <Route exact path="/cluster/volumes" component={Disks}></Route>
          <Route exact path="/settings/dependencies" component={DependencyListPage}></Route>

          <Route exact path="/applications" component={ApplicationListPage} />
          <Route exact path="/applications/:applicationName" component={ApplicationShow} />
          <Route exact path="/applications/:applicationName/edit" component={ApplicationEdit} />
          <Route exact path="/applications/:applicationName/logs" component={Log} />
          <Route exact path="/applications/:applicationName/shells" component={Log} />
          <Route exact path="/applications/new" component={ApplicationNew} />
          <Route exact path="/configs" component={ConfigListPage}></Route>

          <Route component={NoMatch} />
        </Switch>
      </Dashboard>
    </Route>
  </Switch>
);
