import { Api } from "./base";
import Immutable from "immutable";
import { CertificateIssuerFormType, CertificateFormType } from "types/certificate";
import { ApplicationDetails, ApplicationComponentDetails, Application, ApplicationComponent } from "types/application";
import { HttpRoute } from "types/route";
import { RegistryType } from "types/registry";
import { RoleBindingsRequestBody } from "types/user";
import MockStore from "./mockStore";

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
    return await mockStore.data.get("mockSimpleOptions");
  };

  public getStatefulSetOptions = async (namespace: string) => {
    return await mockStore.data.get("mockStatefulSetOptions");
  };

  public getRegistries = async () => {
    return mockStore.data.get("mockRegistries");
  };

  public getKappApplicationList = async () => {
    return mockStore.data.get("mockApplications");
  };

  public getKappApplication = async (name: string) => {
    return mockStore.data.get("mockApplications").find((application) => application.get("name") === name)!;
  };

  public getKappApplicationComponentList = async (applicationName: string) => {
    return mockStore.data.getIn(["mockApplicationComponents", applicationName]);
  };

  public getKappApplicationComponent = async (applicationName: string, name: string) => {
    return mockStore.data
      .get("mockApplicationComponents")
      .get(applicationName)
      ?.find((component) => component.get("name") === name)!;
  };

  public getHttpRoutes = async (namespace: string) => {
    return mockStore.data.get("mockHttpRoutes");
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

  public createCertificate = async (certificate: CertificateFormType, isEdit?: boolean) => {
    await mockStore.updateCertificate(certificate);
    return certificate as any;
  };

  public createCertificateIssuer = async (certificateIssuer: CertificateIssuerFormType, isEdit?: boolean) => {
    await mockStore.updateCertificateIssuer(certificateIssuer);
    return certificateIssuer;
  };

  public createHttpRoute = async (namespace: string, httpRoute: HttpRoute) => {
    await mockStore.updateHttpRoute(httpRoute);
    return httpRoute;
  };

  public createKappApplication = async (application: Application) => {
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
    await mockStore.updateKappApplication(applicationDetails);
    return application as ApplicationDetails;
  };

  public createKappApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
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
    await mockStore.updateKappApplicationComponent(applicationName, componentDetails);
    return component as ApplicationComponentDetails;
  };

  public createRegistry = async (registry: RegistryType) => {
    await mockStore.updateRegistry(registry);
    return Immutable.fromJS(registry);
  };

  // TODO (has not been used)
  public createRoleBindings = async (roleBindingRequestBody: RoleBindingsRequestBody) => {};

  public deleteCertificate = async (name: string) => {
    await mockStore.deleteCertificate(name);
  };

  public deleteHttpRoute = async (namespace: string, name: string) => {
    await mockStore.deleteHttpRoute(name);
    return true;
  };

  public deleteKappApplication = async (name: string): Promise<void> => {
    await mockStore.deleteKappApplication(name);
  };

  public deleteKappApplicationComponent = async (applicationName: string, name: string) => {
    await mockStore.deleteKappApplicationComponent(applicationName, name);
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

  // TODO (has not been used)
  public getKappApplicationPlugins = async () => {
    return [];
  };

  public getKappComponentPlugins = async () => {
    return mockStore.data.get("mockComponentPlugins").toArray();
  };

  public getRegistry = async (name: string) => {
    return mockStore.data.get("mockRegistries").find((c) => c.get("name") === name)!;
  };

  // TODO
  public getServiceAccountSecret = async (name: string) => {
    return "";
  };

  // TODO
  public loadRolebindings = async () => {
    return Immutable.fromJS([]);
  };

  public updateHttpRoute = async (namespace: string, name: string, httpRoute: HttpRoute) => {
    await mockStore.updateHttpRoute(httpRoute);
    return Immutable.fromJS(httpRoute);
  };

  public updateKappApplication = async (application: Application) => {
    await mockStore.updateKappApplication(application as ApplicationDetails);
    return Immutable.fromJS(application);
  };

  public updateKappApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    await mockStore.updateKappApplicationComponent(applicationName, component as ApplicationComponentDetails);
    return Immutable.fromJS(component);
  };

  public updateRegistry = async (registry: RegistryType) => {
    await mockStore.updateRegistry(registry);
    return Immutable.fromJS(registry);
  };
}
