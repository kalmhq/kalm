import Immutable from "immutable";
import { Application, ApplicationComponent, ApplicationComponentDetails, ApplicationDetails } from "types/application";
import { CertificateFormTypeContent, CertificateIssuerFormTypeContent } from "types/certificate";
import { InitializeClusterResponse } from "types/cluster";
import { DeployKeyFormType, DeployKeyFormTypeContent } from "types/deployKey";
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
    return mockStore.data.get("mockNodes");
  };

  public cordonNode = async () => {
    return mockStore.data.get("mockNodes").get("nodes").get(0)!;
  };

  public uncordonNode = async () => {
    return mockStore.data.get("mockNodes").get("nodes").get(0)!;
  };

  public getPersistentVolumes = async () => {
    return mockStore.data.get("mockVolumes");
  };

  public getStorageClasses = async () => {
    return mockStore.data.get("mockStorageClasses");
  };

  public getSimpleOptions = async (namespace: string) => {
    return mockStore.data.get("mockSimpleOptions");
  };

  public getStatefulSetOptions = async (namespace: string) => {
    return mockStore.data.get("mockStatefulSetOptions");
  };

  public getRegistries = async (): Promise<Registry[]> => {
    return mockStore.dataImmer.mockRegistries;
  };

  public getApplicationList = async () => {
    return mockStore.data.get("mockApplications");
  };

  public getApplication = async (name: string) => {
    return mockStore.data.get("mockApplications").find((application) => application.get("name") === name)!;
  };

  public getApplicationComponentList = async (applicationName: string) => {
    return mockStore.data.getIn(["mockApplicationComponents", applicationName]);
  };

  public getApplicationComponent = async (applicationName: string, name: string) => {
    return mockStore.data
      .get("mockApplicationComponents")
      .get(applicationName)
      ?.find((component) => component.get("name") === name)!;
  };

  public getHttpRoutes = async () => {
    return mockStore.data.get("mockHttpRoutes");
  };

  public createHttpRoute = async (httpRoute: HttpRoute) => {
    await mockStore.updateHttpRoute(httpRoute.get("namespace"), httpRoute);
    return httpRoute;
  };

  public updateHttpRoute = async (httpRoute: HttpRoute) => {
    await mockStore.updateHttpRoute(httpRoute.get("namespace"), httpRoute);
    return Immutable.fromJS(httpRoute);
  };

  public deleteHttpRoute = async (httpRoute: HttpRoute) => {
    await mockStore.deleteHttpRoute(httpRoute.get("namespace"), httpRoute.get("name"));
    return true;
  };

  public mockLoadRolebindings = async () => {
    return Immutable.fromJS([]);
  };

  public getCertificateList = async () => {
    return mockStore.data.get("mockCertificates");
  };

  public getCertificateIssuerList = async () => {
    return mockStore.data.get("mockCertificateIssuers");
  };

  public createCertificate = async (certificate: CertificateFormTypeContent, isEdit?: boolean) => {
    await mockStore.updateCertificate(certificate);
    return certificate as any;
  };

  public createCertificateIssuer = async (certificateIssuer: CertificateIssuerFormTypeContent, isEdit?: boolean) => {
    await mockStore.updateCertificateIssuer(certificateIssuer);
    return Immutable.fromJS(certificateIssuer);
  };

  public createApplication = async (application: Application) => {
    let applicationDetails = application as ApplicationDetails;
    applicationDetails = applicationDetails.set(
      "metrics",
      Immutable.fromJS({
        cpu: null,
        memory: null,
      }),
    );
    applicationDetails = applicationDetails.set("roles", Immutable.fromJS(["writer", "reader"]));
    applicationDetails = applicationDetails.set("status", "Active");
    applicationDetails = applicationDetails.set("istioMetricHistories", Immutable.fromJS({}));
    await mockStore.updateApplication(applicationDetails);
    return applicationDetails;
  };

  public createApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    let componentDetails = component as ApplicationComponentDetails;
    componentDetails = componentDetails.set(
      "metrics",
      Immutable.fromJS({
        cpu: null,
        memory: null,
      }),
    );
    componentDetails = componentDetails.set("services", Immutable.fromJS([]));
    componentDetails = componentDetails.set("pods", Immutable.List([mockStore.data.get("mockErrorPod")]));
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
    return Immutable.fromJS(component);
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

  public listDeployKeys = async (): Promise<Immutable.List<DeployKeyFormType>> => {
    return Immutable.List();
  };

  public createDeployKey = async (protectedEndpoint: DeployKeyFormTypeContent): Promise<DeployKeyFormType> => {
    return Immutable.Map();
  };

  public deleteDeployKey = async (deployKey: DeployKeyFormType): Promise<void> => {};

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
