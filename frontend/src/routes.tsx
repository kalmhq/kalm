import { DashboardLayout } from "layout/DashboardLayout";
import { Login } from "layout/Login";
import { ApplicationListPage } from "pages/Application/List";
import { Log } from "pages/Application/Log";
import { ApplicationNewPage } from "pages/Application/New";
import { ApplicationShowPage } from "pages/Application/Show";
import { CertificateAcmePage } from "pages/Certificate/Acme";
import { CertificateAcmeEditPage } from "pages/Certificate/AcmeEdit";
import { CertificateDetailPage } from "pages/Certificate/Detail";
import { CertificateEditPage } from "pages/Certificate/Edit";
import { CertificateListPage } from "pages/Certificate/List";
import { CertificateNewPage } from "pages/Certificate/New";
import { CertificateUploadPage } from "pages/Certificate/Upload";
import { WebhookPage } from "pages/Webhook";
import { DeployAccessTokenDetailPage } from "pages/Webhook/Detail";
import { DeployAccessTokenNewPage } from "pages/Webhook/New";
import { ComponentEditPage } from "pages/Components/Edit";
import { ComponentListPage } from "pages/Components/List";
import { ComponentNewPage } from "pages/Components/New";
import { ComponentShowPage } from "pages/Components/Show";
import { DiskListPage } from "pages/Disks/List";
import { DomainDetailPage } from "pages/Domains/Detail";
import { DomainListPage } from "pages/Domains/List";
import { DomainNewPage } from "pages/Domains/New";
import { DomainTourPage } from "pages/Domains/Tour";
import { LoadBalancerInfoPage } from "pages/LoadBalancer";
import { RolesListPage } from "pages/Members";
import { MemberNewPage } from "pages/Members/New";
import { NodeListPage } from "pages/Nodes/List";
import { NoMatch, Page404 } from "pages/NoMatch";
import { ProfilePage } from "pages/Profile";
import { PullSecretsEditPage } from "pages/PullSecrets/Edit";
import { PullSecretsListPage } from "pages/PullSecrets/List";
import { PullSecretsNewPage } from "pages/PullSecrets/New";
import { RouteEditPage } from "pages/Route/Edit";
import { RouteListPage } from "pages/Route/List";
import { RouteNewPage } from "pages/Route/New";
import { RouteRedirectList } from "pages/Route/Redirect";
import { SetupPage } from "pages/Setup";
import { SSOPage } from "pages/SSO";
import { SSOConfigPage } from "pages/SSO/Config";
import { SystemPage } from "pages/System";
import { TenantsPage } from "pages/Tenants";
import { TenantUsagePage } from "pages/Tenants/Usages";
import { VersionPage } from "pages/Version";
import { RequireAuthorized, RequireNotAuthorized } from "permission/Authorization";
import React from "react";
import { Redirect, Route, Switch } from "react-router";

const RequireAuthorizedDashboard = RequireAuthorized(DashboardLayout);

export const KalmRoutes = (
  <Switch>
    <Route path="/404" component={Page404} />
    <Route path="/login" component={RequireNotAuthorized(Login)} />
    <Route path="/">
      <RequireAuthorizedDashboard>
        <Switch>
          <Route path="/tenants" component={TenantsPage} />
          <Route path="/usage" component={TenantUsagePage} />
          <Route exact path="/profile" component={ProfilePage} />

          <Route exact path="/system" component={SystemPage} />
          <Route exact path="/setup" component={SetupPage} />

          <Route exact path="/sso" component={SSOPage} />
          <Route exact path="/sso/config" component={SSOConfigPage} />
          <Route exact path="/version" component={VersionPage} />

          <Redirect exact path="/cluster" to="/" />
          <Route exact path="/cluster/nodes" component={NodeListPage} />
          <Route exact path="/cluster/loadbalancer" component={LoadBalancerInfoPage} />
          <Route exact path="/cluster/disks" component={DiskListPage} />
          <Route exact path="/cluster/pull-secrets" component={PullSecretsListPage} />
          <Route exact path="/cluster/pull-secrets/new" component={PullSecretsNewPage} />
          <Route exact path="/cluster/pull-secrets/:name/edit" component={PullSecretsEditPage} />

          <Route exact path="/cluster/members" component={RolesListPage} />
          <Route exact path="/cluster/members/new" component={MemberNewPage} />
          <Route exact path="/cluster/members/:name/edit" component={RolesListPage} />

          <Route exact path="/webhooks" component={WebhookPage} />
          <Redirect exact path="/webhooks/keys" to="/webhooks" />
          <Route exact path="/webhooks/keys/new" component={DeployAccessTokenNewPage} />
          <Route exact path="/webhooks/keys/:name" component={DeployAccessTokenDetailPage} />

          <Route exact path="/applications" component={ApplicationListPage} />
          <Route exact path="/applications/new" component={ApplicationNewPage} />
          <Route exact path="/applications/:applicationName/" component={ComponentListPage} />
          <Route exact path="/applications/:applicationName/metrics" component={ApplicationShowPage} />

          <Route exact path="/routes" component={RouteListPage} />
          <Route exact path="/routes/new" component={RouteNewPage} />
          <Route exact path="/routes/:name/edit" component={RouteEditPage} />
          <Route exact path="/routes/:name" component={RouteRedirectList} />

          <Route exact path="/applications/:applicationName/components" component={ComponentListPage} />
          <Route exact path="/applications/:applicationName/components/new" component={ComponentNewPage} />
          <Route exact path="/applications/:applicationName/components/:name" component={ComponentShowPage} />
          <Route exact path="/applications/:applicationName/components/:name/edit" component={ComponentEditPage} />

          <Route exact path="/applications/:applicationName/members" component={RolesListPage} />
          <Route exact path="/applications/:applicationName/members/new" component={MemberNewPage} />
          <Route exact path="/applications/:applicationName/members/:name/edit" component={RolesListPage} />

          <Route exact path="/applications/:applicationName/logs" component={Log} />
          <Route exact path="/applications/:applicationName/shells" component={Log} />

          <Route exact path="/domains" component={DomainListPage} />
          <Route exact path="/domains/new" component={DomainNewPage} />
          <Route exact path="/domains/:name" component={DomainDetailPage} />
          <Route exact path="/domains/:name/tour" component={DomainTourPage} />

          <Route exact path="/certificates" component={CertificateListPage} />
          <Route exact path="/certificates/new" component={CertificateNewPage} />
          <Route exact path="/certificates/upload" component={CertificateUploadPage} />
          <Route exact path="/certificates/:name/edit" component={CertificateEditPage} />
          <Route exact path="/certificates/:name" component={CertificateDetailPage} />
          <Route exact path="/acme" component={CertificateAcmePage} />
          <Route exact path="/acme/edit" component={CertificateAcmeEditPage} />
          <Route component={NoMatch} />
        </Switch>
      </RequireAuthorizedDashboard>
    </Route>
  </Switch>
);
