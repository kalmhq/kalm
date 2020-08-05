import React from "react";

import { DashboardLayout } from "layout/DashboardLayout";
import { Login } from "layout/Login";

import { ApplicationListPage } from "pages/Application/List";
import { Log } from "pages/Application/Log";
import { ApplicationNewPage } from "pages/Application/New";
import { ApplicationShowPage } from "pages/Application/Show";
import { CertificateListPage } from "pages/Certificate/List";
import { NodeListPage } from "pages/Nodes/List";
import { LoadBalancerInfoPage } from "pages/LoadBalancer";
import { NoMatch, Page404 } from "pages/NoMatch";
import { DiskListPage } from "pages/Disks/List";
import { RegistryListPage } from "pages/Registry/List";
import { RouteEditPage } from "pages/Route/Edit";
import { RouteListPage } from "pages/Route/List";
import { RouteNewPage } from "pages/Route/New";
import { Redirect, Route, Switch } from "react-router";
import { ComponentListPage } from "pages/Components/List";
import { ComponentNewPage } from "pages/Components/New";
import { ComponentEditPage } from "pages/Components/Edit";
import { ComponentShowPage } from "pages/Components/Show";
import { RequireAuthorizated, RequireNotAuthorizated } from "permission/Authorization";
import { RequireNamespaceReader, RequireNamespaceWriter } from "permission/Namespace";
import { RequireAdmin } from "permission/Role";
import { SSOPage } from "pages/SSO";
import { SSOConfigPage } from "pages/SSO/Config";
import { CIPage } from "pages/CI";
import { DeployKeyNewPage } from "pages/CI/New";
import { NewEndpointPage } from "pages/SSO/NewEndpoint";
import { EditEndpointPage } from "pages/SSO/EditEndpoint";
import { CertificateNewPage } from "pages/Certificate/New";
import { CertificateEditPage } from "pages/Certificate/Edit";
import { RegistryNewPage } from "pages/Registry/New";
import { RegistryEditPage } from "pages/Registry/Edit";
import { DeployKeyDetailPage } from "pages/CI/Detail";

const RequireAuthorizatedDashboard = RequireAuthorizated(DashboardLayout);

export const KalmRoutes = (
  <Switch>
    <Route path="/404" component={Page404} />
    <Route path="/login" component={RequireNotAuthorizated(Login)} />
    <Route path="/">
      <RequireAuthorizatedDashboard>
        <Switch>
          <Route exact path="/sso" component={SSOPage} />
          <Route exact path="/sso/config" component={SSOConfigPage} />
          <Redirect exact path="/sso/endpoints" to="/sso" />
          <Route exact path="/sso/endpoints/new" component={NewEndpointPage} />
          <Route exact path="/sso/endpoints/:name/edit" component={EditEndpointPage} />

          <Redirect exact path="/cluster" to="/" />
          <Route exact path="/cluster/nodes" component={NodeListPage} />
          <Route exact path="/cluster/loadbalancer" component={LoadBalancerInfoPage} />
          <Route exact path="/cluster/disks" component={DiskListPage} />
          <Route exact path="/cluster/registries" component={RegistryListPage} />
          <Route exact path="/cluster/registries/new" component={RegistryNewPage} />
          <Route exact path="/cluster/registries/:name/edit" component={RegistryEditPage} />

          <Route exact path="/ci" component={CIPage} />
          <Redirect exact path="/ci/keys" to="/ci" />
          <Route exact path="/ci/keys/new" component={DeployKeyNewPage} />
          <Route exact path="/ci/keys/:name" component={DeployKeyDetailPage} />

          <Route exact path="/applications" component={RequireAdmin(ApplicationListPage)} />
          <Route exact path="/applications/new" component={RequireAdmin(ApplicationNewPage)} />
          <Route exact path="/applications/:applicationName/" component={ComponentListPage} />
          <Route
            exact
            path="/applications/:applicationName/metrics"
            component={RequireNamespaceReader(ApplicationShowPage)}
          />

          <Route exact path="/routes" component={RequireNamespaceReader(RouteListPage)} />
          <Route exact path="/routes/new" component={RequireNamespaceReader(RouteNewPage)} />
          <Route exact path="/routes/:name/edit" component={RouteEditPage} />

          <Route exact path="/applications/:applicationName/components" component={ComponentListPage} />
          <Route exact path="/applications/:applicationName/components/new" component={ComponentNewPage} />
          <Route exact path="/applications/:applicationName/components/:name" component={ComponentShowPage} />
          <Route exact path="/applications/:applicationName/components/:name/edit" component={ComponentEditPage} />

          <Route exact path="/applications/:applicationName/logs" component={RequireNamespaceReader(Log)} />
          <Route exact path="/applications/:applicationName/shells" component={RequireNamespaceWriter(Log)} />

          <Route exact path="/certificates" component={CertificateListPage} />
          <Route exact path="/certificates/new" component={CertificateNewPage} />
          <Route exact path="/certificates/:name/edit" component={CertificateEditPage} />
          <Route component={NoMatch} />
        </Switch>
      </RequireAuthorizatedDashboard>
    </Route>
  </Switch>
);
