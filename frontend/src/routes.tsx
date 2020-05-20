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
import DashboardPage from "pages/Dashboard";
import InstallPage from "pages/Install";
import { NodeListPage } from "pages/NodeList";
import { NoMatch, Page404 } from "pages/NoMatch";
import { RolesPage } from "pages/Roles";
import React from "react";
import { Route, Switch } from "react-router";
import { RequireNotAuthorizated, RequireAuthorizated } from "permission/Authorization";
import { RequireAdmin } from "permission/Role";
import { RequireNamespaceReader, RequireNamespaceWriter } from "permission/Namespace";
import { UIComponentsPage } from "pages/UIComponents";
import { RegistryListPage } from "pages/Registry/List";
import { RouteListPage } from "pages/Route/List";

const RequireAuthorizatedDashboard = RequireAuthorizated(Dashboard);

export const KappRoutes = (
  <Switch>
    <Route path="/404" component={Page404} />
    <Route path="/login" component={RequireNotAuthorizated(Login)} />
    <Route path="/">
      <RequireAuthorizatedDashboard>
        <Switch>
          <Route exact path="/" component={DashboardPage} />
          <Route exact path="/roles" component={RequireAdmin(RolesPage)} />

          {/* begin, TODO */}
          <Route exact path="/install" component={InstallPage} />
          <Route exact path="/componenttemplates/new" component={ComponentTemplateNew} />
          <Route exact path="/componenttemplates/:componentTemplateName/edit" component={ComponentTemplateEdit}></Route>
          <Route exact path="/componenttemplates" component={ComponentTemplateListPage}></Route>
          {/* end */}

          <Route exact path="/cluster/nodes" component={NodeListPage}></Route>
          <Route exact path="/cluster/volumes" component={Disks}></Route>
          <Route exact path="/cluster/registries" component={RegistryListPage}></Route>
          <Route exact path="/settings/dependencies" component={RequireAdmin(DependencyListPage)}></Route>

          {/* <Route exact path="/applications/:applicationName/components/:name" component={RequireNamespaceWriter(ApplicationComponentShow)} /> */}

          <Route exact path="/templates" component={RequireAdmin(ApplicationListPage)} />
          <Route exact path="/applications" component={RequireAdmin(ApplicationListPage)} />
          <Route exact path="/applications/new" component={RequireAdmin(ApplicationNew)} />
          <Route exact path="/applications/:applicationName" component={RequireNamespaceReader(ApplicationShow)} />
          <Route exact path="/applications/:applicationName/edit" component={RequireNamespaceWriter(ApplicationEdit)} />
          <Route exact path="/applications/:applicationName/logs" component={RequireNamespaceReader(Log)} />
          <Route exact path="/applications/:applicationName/shells" component={RequireNamespaceWriter(Log)} />
          <Route
            exact
            path="/applications/:applicationName/components/:componentName"
            component={RequireNamespaceReader(ApplicationShow)}
          />
          <Route exact path="/configs" component={RequireNamespaceReader(ConfigListPage)}></Route>
          <Route exact path="/routes" component={RequireNamespaceReader(RouteListPage)}></Route>
          <Route exact path="/ui-components" component={UIComponentsPage}></Route>
          <Route component={NoMatch} />
        </Switch>
      </RequireAuthorizatedDashboard>
    </Route>
  </Switch>
);
