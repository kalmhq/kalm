import { Application, ApplicationComponent, ApplicationComponentDetails, ApplicationDetails } from "types/application";
import { AcmeServerFormType, AcmeServerInfo, CertificateFormType, CertificateIssuerFormType } from "types/certificate";
import { InitializeClusterResponse } from "types/cluster";
import { DeployAccessToken } from "types/deployAccessToken";
import { RoleBinding } from "types/member";
import { Registry, RegistryFormType } from "types/registry";
import { HttpRoute } from "types/route";
import { ProtectedEndpoint, SSOConfig } from "types/sso";
import { Api } from "../base";
import MockStore from "../mockStore";

export const mockStore = new MockStore();

export default class MockApi extends Api {
  public getClusterInfo = async () => {
    return mockStore.data.mockClusterInfo;
  };

  public getLoginStatus = async () => {
    return mockStore.data.mockLoginStatus;
  };

  public validateToken = async (token: string): Promise<boolean> => {
    return true;
  };

  public getNodes = async () => {
    return mockStore.data.mockNodes;
  };

  public cordonNode = async () => {
    return mockStore.data.mockNodes.nodes[0];
  };

  public uncordonNode = async () => {
    return mockStore.data.mockNodes.nodes[0];
  };

  public getPersistentVolumes = async () => {
    return mockStore.data.mockVolumes;
  };

  public getStorageClasses = async () => {
    return mockStore.data.mockStorageClasses;
  };

  public getSimpleOptions = async (namespace: string) => {
    return mockStore.data.mockSimpleOptions;
  };

  public getStatefulSetOptions = async (namespace: string) => {
    return mockStore.data.mockStatefulSetOptions;
  };

  public getRegistries = async (): Promise<Registry[]> => {
    return mockStore.data.mockRegistries;
  };

  public getApplicationList = async () => {
    return mockStore.data.mockApplications;
  };

  public getApplication = async (name: string) => {
    return mockStore.data.mockApplications.find((application) => application.name === name)!;
  };

  public getApplicationComponentList = async (applicationName: string) => {
    return mockStore.data.mockApplicationComponents[applicationName];
  };

  public getApplicationComponent = async (applicationName: string, name: string) => {
    return mockStore.data.mockApplicationComponents[applicationName].find(
      (c) => c.name === name,
    ) as ApplicationComponentDetails;
  };

  public getHttpRoutes = async () => {
    return mockStore.data.mockHttpRoutes;
  };

  public createHttpRoute = async (httpRoute: HttpRoute) => {
    await mockStore.updateHttpRoute(httpRoute.namespace, httpRoute);
    return httpRoute;
  };

  public updateHttpRoute = async (httpRoute: HttpRoute) => {
    await mockStore.updateHttpRoute(httpRoute.namespace, httpRoute);
    return httpRoute;
  };

  public deleteHttpRoute = async (httpRoute: HttpRoute) => {
    await mockStore.deleteHttpRoute(httpRoute.namespace, httpRoute.name);
    return true;
  };

  public mockLoadRolebindings = async () => {
    return [];
  };

  public getCertificateList = async () => {
    return mockStore.data.mockCertificates;
  };

  public getCertificateIssuerList = async () => {
    return mockStore.data.mockCertificateIssuers;
  };

  public createCertificate = async (certificate: CertificateFormType, isEdit?: boolean) => {
    await mockStore.updateCertificate(certificate);
    return certificate as any;
  };

  public createCertificateIssuer = async (certificateIssuer: CertificateIssuerFormType, isEdit?: boolean) => {
    await mockStore.updateCertificateIssuer(certificateIssuer);
    return certificateIssuer;
  };

  public createApplication = async (application: Application) => {
    let applicationDetails = application as ApplicationDetails;

    applicationDetails.metrics = {
      isMetricServerEnabled: true,
      cpu: [],
      memory: [],
    };
    applicationDetails.roles = ["writer", "reader"];
    applicationDetails.status = "Active";
    applicationDetails.istioMetricHistories = {};

    await mockStore.updateApplication(applicationDetails);
    return applicationDetails;
  };

  public createApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    let componentDetails = component as ApplicationComponentDetails;

    componentDetails.metrics = {
      isMetricServerEnabled: true,
      cpu: [],
      memory: [],
    };
    componentDetails.services = [];
    componentDetails.pods = [mockStore.data.mockErrorPod];

    await mockStore.updateApplicationComponent(applicationName, componentDetails);
    return componentDetails;
  };

  public createRegistry = async (registry: RegistryFormType) => {
    await mockStore.updateRegistry(registry);
    return registry as Registry;
  };

  // TODO (has not been used)
  public createRoleBinding = async (roleBinding: RoleBinding) => {};
  public updateRoleBinding = async (roleBinding: RoleBinding) => {};

  public deleteCertificate = async (name: string) => {
    await mockStore.deleteCertificate(name);
  };

  public deleteApplication = async (name: string): Promise<void> => {
    await mockStore.deleteApplication(name);
  };

  public deleteApplicationComponent = async (applicationName: string, name: string) => {
    await mockStore.deleteApplicationComponent(applicationName, name);
  };

  public loadServices = async (name: string) => {
    return mockStore.data.mockServices;
  };

  public deletePersistentVolume = async (name: string): Promise<void> => {
    await mockStore.deleteVolume(name);
  };

  public deletePod = async (namespace: string, name: string) => {
    await mockStore.deletePod(namespace, name);
  };

  public deleteRegistry = async (name: string) => {
    await mockStore.deleteRegistry(name);
  };

  // TODO
  public deleteRoleBinding = async (namespace: string, bindingName: string) => {};

  // TODO (has not been used)
  public getApplicationPlugins = async () => {
    return [];
  };

  public getRegistry = async (name: string) => {
    return mockStore.data.mockRegistries.find((x) => x.name === name)!;
  };

  // TODO
  public loadRoleBindings = async () => {
    return [];
  };

  public getServiceAccountSecret = async (name: string) => {
    return "";
  };

  public updateApplication = async (application: Application) => {
    await mockStore.updateApplication(application as ApplicationDetails);
    return application as ApplicationDetails;
  };

  public updateApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    await mockStore.updateApplicationComponent(applicationName, component as ApplicationComponentDetails);
    return component as ApplicationComponentDetails;
  };

  public updateRegistry = async (registry: RegistryFormType) => {
    await mockStore.updateRegistry(registry);
    return registry as Registry;
  };

  // TODO
  public getSSOConfig = async (): Promise<SSOConfig> => {
    return mockStore.data.mockSSO;
  };

  public createSSOConfig = async (ssoConfig: SSOConfig): Promise<SSOConfig> => {
    return {} as any;
  };

  public updateSSOConfig = async (ssoConfig: SSOConfig): Promise<SSOConfig> => {
    return {} as any;
  };

  public deleteSSOConfig = async (): Promise<void> => {};

  public listProtectedEndpoints = async (): Promise<ProtectedEndpoint[]> => {
    return [];
  };

  public createProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint> => {
    return {} as any;
  };

  public updateProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint> => {
    return {} as any;
  };

  public deleteProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<void> => {};

  public listDeployAccessTokens = async (): Promise<DeployAccessToken[]> => {
    return [];
  };

  public createDeployAccessToken = async (protectedEndpoint: DeployAccessToken): Promise<DeployAccessToken> => {
    return {} as any;
  };

  public deleteDeployAccessToken = async (protectedEndpoint: DeployAccessToken): Promise<void> => {};

  public resolveDomain = async (domain: string, type: "A" | "CNAME", timeout: number = 5000): Promise<string[]> => {
    return ["1.1.1.1"];
  };

  public initializeCluster = async (domain: string): Promise<InitializeClusterResponse> => {
    return {} as any;
  };

  public resetCluster = async (): Promise<any> => {
    return {};
  };

  public createAcmeServer = async (acmeServer: AcmeServerFormType): Promise<AcmeServerInfo> => {
    return mockStore.data.mockAcmeServer;
  };

  public deleteAcmeServer = async (acmeServer: AcmeServerFormType): Promise<void> => {
    return;
  };

  public getAcmeServer = async (): Promise<AcmeServerInfo> => {
    return mockStore.data.mockAcmeServer;
  };
}
