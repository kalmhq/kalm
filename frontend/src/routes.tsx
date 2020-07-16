import React from "react";

import { DashboardLayout } from "layout/DashboardLayout";
import { Login } from "layout/Login";

import { ApplicationListPage } from "pages/Application/List";
import { Log } from "pages/Application/Log";
import { ApplicationNewPage } from "pages/Application/New";
import { ApplicationShowPage } from "pages/Application/Show";
import { CertificateListPage } from "pages/Certificate/List";
import { NodeListPage } from "pages/Nodes/List";
import { IngressInfoPage } from "pages/Ingress";
import { NoMatch, Page404 } from "pages/NoMatch";
import { DiskListPage } from "pages/Disks";
import { RegistryListPage } from "pages/Registry/List";
import { RouteEditPage } from "pages/Route/Edit";
import { RouteListPage } from "pages/Route/List";
import { RouteNewPage } from "pages/Route/New";
import { Route, Switch } from "react-router";
import { ComponentListPage } from "pages/Components/List";
import { ComponentNewPage } from "pages/Components/New";
import { ComponentEditPage } from "pages/Components/Edit";
import { ComponentShowPage } from "pages/Components/Show";

import { RequireAuthorizated, RequireNotAuthorizated } from "permission/Authorization";
import { RequireNamespaceReader, RequireNamespaceWriter } from "permission/Namespace";
import { RequireAdmin } from "permission/Role";
import { AdminSSOPage } from "pages/Admin/SSO";

const RequireAuthorizatedDashboard = RequireAuthorizated(DashboardLayout);

export const KalmRoutes = (
  <Switch>
    <Route path="/404" component={Page404} />
    <Route path="/login" component={RequireNotAuthorizated(Login)} />
    <Route path="/">
      <RequireAuthorizatedDashboard>
        <Switch>
          <Route exact path="/" component={RequireAdmin(ApplicationListPage)} />
          <Route exact path="/admin/sso" component={AdminSSOPage} />
          <Route exact path="/cluster/nodes" component={NodeListPage} />
          <Route exact path="/cluster/ingress" component={IngressInfoPage} />
          <Route exact path="/cluster/disks" component={DiskListPage} />
          <Route exact path="/cluster/registries" component={RegistryListPage} />
          <Route exact path="/applications" component={RequireAdmin(ApplicationListPage)} />
          <Route exact path="/applications/new" component={RequireAdmin(ApplicationNewPage)} />
          <Route exact path="/applications/:applicationName/" component={ComponentListPage} />
          <Route
            exact
            path="/applications/:applicationName/metrics"
            component={RequireNamespaceReader(ApplicationShowPage)}
          />

          <Route exact path="/applications/:applicationName/routes" component={RequireNamespaceReader(RouteListPage)} />
          <Route
            exact
            path="/applications/:applicationName/routes/new"
            component={RequireNamespaceReader(RouteNewPage)}
          />
          <Route exact path="/applications/:applicationName/routes/:name/edit" component={RouteEditPage} />

          <Route exact path="/applications/:applicationName/components" component={ComponentListPage} />
          <Route exact path="/applications/:applicationName/components/new" component={ComponentNewPage} />
          <Route exact path="/applications/:applicationName/components/:name" component={ComponentShowPage} />
          <Route exact path="/applications/:applicationName/components/:name/edit" component={ComponentEditPage} />

          <Route exact path="/applications/:applicationName/logs" component={RequireNamespaceReader(Log)} />
          <Route exact path="/applications/:applicationName/shells" component={RequireNamespaceWriter(Log)} />

          <Route exact path="/certificates" component={CertificateListPage} />
          <Route component={NoMatch} />
        </Switch>
      </RequireAuthorizatedDashboard>
    </Route>
  </Switch>
);
