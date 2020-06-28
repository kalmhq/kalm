import { DashboardLayout } from "layout/DashboardLayout";
import { Login } from "layout/Login";
import { ApplicationListPage } from "pages/Application/List";
import { Log } from "pages/Application/Log";
import { ApplicationNew } from "pages/Application/New";
import { ApplicationShow } from "pages/Application/Show";
import { CertificateListPage } from "pages/Certificate/List";
import InstallPage from "pages/Install";
import { NodeListPage } from "pages/NodeList";
import { NoMatch, Page404 } from "pages/NoMatch";
import { Volumes } from "pages/PersistentVolumes";
import { RegistryListPage } from "pages/Registry/List";
import { RolesPage } from "pages/Roles";
import { RouteEdit } from "pages/Route/Edit";
import { RouteListPage } from "pages/Route/List";
import { RouteNew } from "pages/Route/New";
import { UIComponentsPage } from "pages/UIComponents";
import { RequireAuthorizated, RequireNotAuthorizated } from "permission/Authorization";
import { RequireNamespaceReader, RequireNamespaceWriter } from "permission/Namespace";
import { RequireAdmin } from "permission/Role";
import React from "react";
import { Route, Switch } from "react-router";
import { ComponentListPage } from "pages/Components/List";
import { ComponentNew } from "pages/Components/New";
import { ComponentEdit } from "pages/Components/Edit";
import { ComponentShow } from "pages/Components/Show";

const RequireAuthorizatedDashboard = RequireAuthorizated(DashboardLayout);

export const KappRoutes = (
  <Switch>
    <Route path="/404" component={Page404} />
    <Route path="/login" component={RequireNotAuthorizated(Login)} />
    <Route path="/">
      <RequireAuthorizatedDashboard>
        <Switch>
          <Route exact path="/" component={RequireAdmin(ApplicationListPage)} />
          <Route exact path="/roles" component={RequireAdmin(RolesPage)} />
          <Route exact path="/install" component={InstallPage} />
          <Route exact path="/cluster/nodes" component={NodeListPage} />
          <Route exact path="/cluster/volumes" component={Volumes} />
          <Route exact path="/cluster/registries" component={RegistryListPage} />
          <Route exact path="/applications" component={RequireAdmin(ApplicationListPage)} />
          <Route exact path="/applications/new" component={RequireAdmin(ApplicationNew)} />
          <Route exact path="/applications/:applicationName" component={RequireNamespaceReader(ApplicationShow)} />

          <Route exact path="/applications/:applicationName/routes" component={RequireNamespaceReader(RouteListPage)} />
          <Route exact path="/applications/:applicationName/routes/new" component={RequireNamespaceReader(RouteNew)} />
          <Route exact path="/applications/:applicationName/routes/:name/edit" component={RouteEdit} />

          <Route exact path="/applications/:applicationName/components" component={ComponentListPage} />
          <Route exact path="/applications/:applicationName/components/new" component={ComponentNew} />
          <Route exact path="/applications/:applicationName/components/:name" component={ComponentShow} />
          <Route exact path="/applications/:applicationName/components/:name/edit" component={ComponentEdit} />

          <Route exact path="/applications/:applicationName/logs" component={RequireNamespaceReader(Log)} />
          <Route exact path="/applications/:applicationName/shells" component={RequireNamespaceWriter(Log)} />
          <Route
            exact
            path="/applications/:applicationName/components/:componentName"
            component={RequireNamespaceReader(ApplicationShow)}
          />
          <Route exact path="/ui-components" component={UIComponentsPage} />
          <Route exact path="/certificates" component={CertificateListPage} />
          <Route component={NoMatch} />
        </Switch>
      </RequireAuthorizatedDashboard>
    </Route>
  </Switch>
);
