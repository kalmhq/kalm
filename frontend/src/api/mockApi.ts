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
    return await mockStore.data.get("mockClusterInfo");
  };

  public getLoginStatus = async () => {
    return await mockStore.data.get("mockLoginStatus");
  };

  public validateToken = async (token: string): Promise<boolean> => {
    return true;
  };

  public getNodes = async () => {
    return await mockStore.data.get("mockNodes");
  };

  public getPersistentVolumes = async () => {
    return await mockStore.data.get("mockVolumes");
  };

  public getStorageClasses = async () => {
    return await mockStore.data.get("mockStorageClasses");
  };

  public getSimpleOptions = async (namespace: string) => {
    return await mockStore.data.get("mockSimpleOptions");
  };

  public getStatefulSetOptions = async (namespace: string) => {
    return await mockStore.data.get("mockStatefulSetOptions");
  };

  public getRegistries = async () => {
    return await mockStore.data.get("mockRegistries");
  };

  public getKappApplicationList = async () => {
    return await mockStore.data.get("mockApplications");
  };

  public getKappApplication = async (name: string) => {
    return await mockStore.data.get("mockApplications").find((application) => application.get("name") === name)!;
  };

  public getKappApplicationComponentList = async (applicationName: string) => {
    return await mockStore.data.get("mockApplicationComponents");
  };

  public getKappApplicationComponent = async (applicationName: string, name: string) => {
    return await mockStore.data.get("mockApplicationComponents").find((component) => component.get("name") === name)!;
  };

  public getHttpRoutes = async (namespace: string) => {
    return await mockStore.data.get("mockHttpRoutes");
  };

  public mockLoadRolebindings = async () => {
    return Immutable.fromJS([]);
  };

  public getCertificateList = async () => {
    return await mockStore.data.get("mockCertificates");
  };

  public getCertificateIssuerList = async () => {
    return await mockStore.data.get("mockCertificateIssuers");
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
    await mockStore.updateKappApplication(application);
    return application as ApplicationDetails;
  };

  public createKappApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    await mockStore.updateKappApplicationComponent(applicationName, component);
    return component as ApplicationComponentDetails;
  };

  public createRegistry = async (registry: RegistryType) => {
    await mockStore.updateRegistry(registry);
    return Immutable.fromJS(registry);
  };

  // TODO
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

  // TODO
  public loadServices = async (name: string) => {
    return Immutable.fromJS({});
  };

  // TODO
  public deletePersistentVolume = async (namespace: string, name: string): Promise<void> => {};

  // TODO
  public deletePod = async (namespace: string, name: string) => {};

  // TODO
  public deleteRegistry = async (name: string) => {};

  // TODO
  public deleteRoleBindings = async (namespace: string, bindingName: string) => {};

  // TODO
  public getKappApplicationPlugins = async () => {
    return [];
  };

  // TODO
  public getKappComponentPlugins = async () => {
    return [];
  };

  public getRegistry = async (name: string) => {
    return await mockStore.data.get("mockRegistries").find((c) => c.get("name") === name)!;
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
    await mockStore.updateKappApplication(application);
    return Immutable.fromJS(application);
  };

  public updateKappApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    await mockStore.updateKappApplicationComponent(applicationName, component);
    return Immutable.fromJS(component);
  };

  public updateRegistry = async (registry: RegistryType) => {
    await mockStore.updateRegistry(registry);
    return Immutable.fromJS(registry);
  };
}
