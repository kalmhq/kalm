import Immutable from "immutable";
import { Application, ApplicationComponent, ApplicationComponentDetails, ApplicationDetails } from "types/application";
import { CertificateForm, CertificateIssuerForm } from "types/certificate";
import { InitializeClusterResponse } from "types/cluster";
import { DeployKey } from "types/deployKey";
import { RegistryFormType, Registry } from "types/registry";
import { HttpRoute } from "types/route";
import { ProtectedEndpoint, SSOConfig } from "types/sso";
import { RoleBindingsRequestBody } from "types/user";
import { Api } from "../base";
import MockStore from "../mockStore";

export const mockStore = new MockStore();

export default class MockApi extends Api {
  public getClusterInfo = async () => {
    return mockStore.data.get("mockClusterInfo");
  };

  public getLoginStatus = async () => {
    return mockStore.data.get("mockLoginStatus");
  };

  public validateToken = async (token: string): Promise<boolean> => {
    return true;
  };

  public getNodes = async () => {
    console.log("mockapi", mockStore.dataImmer.mockNodes);
    return mockStore.dataImmer.mockNodes;
  };

  public cordonNode = async () => {
    return mockStore.dataImmer.mockNodes.nodes[0];
  };

  public uncordonNode = async () => {
    return mockStore.dataImmer.mockNodes.nodes[0];
  };

  public getPersistentVolumes = async () => {
    return mockStore.dataImmer.mockVolumes;
  };

  public getStorageClasses = async () => {
    return mockStore.dataImmer.mockStorageClasses;
  };

  public getSimpleOptions = async (namespace: string) => {
    return mockStore.dataImmer.mockSimpleOptions;
  };

  public getStatefulSetOptions = async (namespace: string) => {
    return mockStore.dataImmer.mockStatefulSetOptions;
  };

  public getRegistries = async (): Promise<Registry[]> => {
    return mockStore.dataImmer.mockRegistries;
  };

  public getApplicationList = async () => {
    return mockStore.dataImmer.mockApplications;
  };

  public getApplication = async (name: string) => {
    return mockStore.dataImmer.mockApplications.find((application) => application.name === name)!;
  };

  public getApplicationComponentList = async (applicationName: string) => {
    return mockStore.dataImmer.mockApplicationComponents[applicationName];
  };

  public getApplicationComponent = async (applicationName: string, name: string) => {
    return mockStore.dataImmer.mockApplicationComponents[applicationName].find(
      (c) => c.name === name,
    ) as ApplicationComponentDetails;
  };

  public getHttpRoutes = async () => {
    return mockStore.dataImmer.mockHttpRoutes;
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
    return Immutable.fromJS([]);
  };

  public getCertificateList = async () => {
    return mockStore.dataImmer.mockCertificates;
  };

  public getCertificateIssuerList = async () => {
    return mockStore.dataImmer.mockCertificateIssuers;
  };

  public createCertificate = async (certificate: CertificateForm, isEdit?: boolean) => {
    await mockStore.updateCertificate(certificate);
    return certificate as any;
  };

  public createCertificateIssuer = async (certificateIssuer: CertificateIssuerForm, isEdit?: boolean) => {
    await mockStore.updateCertificateIssuer(certificateIssuer);
    return Immutable.fromJS(certificateIssuer);
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
    componentDetails.pods = [mockStore.dataImmer.mockErrorPod];

    await mockStore.updateApplicationComponent(applicationName, componentDetails);
    return componentDetails;
  };

  public createRegistry = async (registry: RegistryFormType) => {
    await mockStore.updateRegistry(registry);
    return registry as Registry;
  };

  // TODO (has not been used)
  public createRoleBindings = async (roleBindingRequestBody: RoleBindingsRequestBody) => {};

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
    return mockStore.data.get("mockServices");
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
  public deleteRoleBindings = async (namespace: string, bindingName: string) => {};

  public getRegistry = async (name: string) => {
    return mockStore.dataImmer.mockRegistries.find((x) => x.name === name)!;
  };

  // TODO
  public getServiceAccountSecret = async (name: string) => {
    return "";
  };

  // TODO
  public loadRolebindings = async () => {
    return Immutable.fromJS([]);
  };

  public updateApplication = async (application: Application) => {
    await mockStore.updateApplication(application as ApplicationDetails);
    return Immutable.fromJS(application);
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
    return mockStore.data.get("mockSSO");
  };

  public createSSOConfig = async (ssoConfig: SSOConfig): Promise<SSOConfig> => {
    return Immutable.Map();
  };

  public updateSSOConfig = async (ssoConfig: SSOConfig): Promise<SSOConfig> => {
    return Immutable.Map();
  };

  public deleteSSOConfig = async (): Promise<void> => {};

  public listProtectedEndpoints = async (): Promise<Immutable.List<ProtectedEndpoint>> => {
    return Immutable.List();
  };

  public createProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint> => {
    return Immutable.Map();
  };

  public updateProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint> => {
    return Immutable.Map();
  };

  public deleteProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<void> => {};

  public listDeployKeys = async (): Promise<DeployKey[]> => {
    return [];
  };

  public createDeployKey = async (protectedEndpoint: DeployKey): Promise<DeployKey> => {
    return protectedEndpoint;
  };

  public deleteDeployKey = async (deployKey: DeployKey): Promise<void> => {};

  public resolveDomain = async (domain: string, type: "A" | "CNAME", timeout: number = 5000): Promise<string[]> => {
    return ["1.1.1.1"];
  };

  public initializeCluster = async (domain: string): Promise<InitializeClusterResponse> => {
    return Immutable.Map({});
  };

  public resetCluster = async (): Promise<any> => {
    return {};
  };
}
