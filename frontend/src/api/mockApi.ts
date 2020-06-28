import { Api } from "./base";
import Immutable from "immutable";
import { CertificateIssuerFormType, CertificateFormType } from "types/certificate";
import { ApplicationDetails, ApplicationComponentDetails, Application, ApplicationComponent } from "types/application";
import { HttpRoute } from "types/route";
import { RegistryType } from "types/registry";
import { RoleBindingsRequestBody } from "types/user";
import MockStore from "./mockStore";

const mockStore = new MockStore();

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

  public getPersistentVolumes = async () => {
    return Immutable.fromJS([]);
  };

  public getStorageClasses = async () => {
    return mockStore.data.mockStorageClasses;
  };

  public getRegistries = async () => {
    return mockStore.data.mockRegistries;
  };

  public getKappApplicationList = async () => {
    return mockStore.data.mockApplications;
  };

  public getKappApplication = async (name: string) => {
    return mockStore.data.mockApplications.find((application) => application.get("name") === name)!;
  };

  public getKappApplicationComponentList = async (applicationName: string) => {
    return mockStore.data.mockApplicationComponents;
  };

  public getKappApplicationComponent = async (applicationName: string, name: string) => {
    return mockStore.data.mockApplicationComponents.find((component) => component.get("name") === name)!;
  };

  public getHttpRoutes = async (namespace: string) => {
    return mockStore.data.mockHttpRoutes;
  };

  public mockLoadRolebindings = async () => {
    return Immutable.fromJS([]);
  };

  public getCertificateList = async () => {
    return mockStore.data.mockCertificates;
  };

  public getCertificateIssuerList = async () => {
    return mockStore.data.mockCertificateIssuers;
  };

  public createCertificate = async (certificate: CertificateFormType, isEdit?: boolean) => {
    if (isEdit) {
      const index = mockStore.data.mockCertificates.findIndex((c) => c.get("name") === certificate.get("name"));
      mockStore.data.mockCertificates = mockStore.data.mockCertificates.set(index, certificate);
    } else {
      mockStore.data.mockCertificates = mockStore.data.mockCertificates.push(certificate);
    }
    mockStore.saveData();
    return certificate as any;
  };

  public createCertificateIssuer = async (certificateIssuer: CertificateIssuerFormType, isEdit?: boolean) => {
    if (isEdit) {
      const index = mockStore.data.mockCertificateIssuers.findIndex(
        (c) => c.get("name") === certificateIssuer.get("name"),
      );
      mockStore.data.mockCertificateIssuers = mockStore.data.mockCertificateIssuers.set(index, certificateIssuer);
    } else {
      mockStore.data.mockCertificateIssuers = mockStore.data.mockCertificateIssuers.push(certificateIssuer);
    }
    mockStore.saveData();
    return certificateIssuer;
  };

  public createHttpRoute = async (namespace: string, httpRoute: HttpRoute) => {
    mockStore.data.mockHttpRoutes = mockStore.data.mockHttpRoutes.push(httpRoute);
    mockStore.saveData();
    return httpRoute;
  };

  public createKappApplication = async (application: Application) => {
    mockStore.data.mockApplications = mockStore.data.mockApplications.push(application as ApplicationDetails);
    mockStore.saveData();
    return application as ApplicationDetails;
  };

  public createKappApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    mockStore.data.mockApplicationComponents.push(component as ApplicationComponentDetails);
    mockStore.saveData();
    return component as ApplicationComponentDetails;
  };

  public createRegistry = async (registry: RegistryType) => {
    mockStore.data.mockRegistries.push(registry as any);
    mockStore.saveData();
    return Immutable.fromJS(registry);
  };

  // TODO
  public createRoleBindings = async (roleBindingRequestBody: RoleBindingsRequestBody) => {};

  public deleteCertificate = async (name: string) => {
    const index = mockStore.data.mockCertificates.findIndex((c) => c.get("name") === name);
    mockStore.data.mockCertificates = mockStore.data.mockCertificates.delete(index);
    mockStore.saveData();
  };

  public deleteHttpRoute = async (namespace: string, name: string) => {
    const index = mockStore.data.mockHttpRoutes.findIndex((c) => c.get("name") === name);
    if (index >= 0) {
      mockStore.data.mockHttpRoutes = mockStore.data.mockHttpRoutes.delete(index);
      mockStore.saveData();
      return true;
    } else {
      return false;
    }
  };

  public deleteKappApplication = async (name: string): Promise<void> => {
    const index = mockStore.data.mockApplications.findIndex((c) => c.get("name") === name);
    if (index >= 0) {
      mockStore.data.mockApplications = mockStore.data.mockApplications.delete(index);
      mockStore.saveData();
    }
  };

  public deleteKappApplicationComponent = async (applicationName: string, name: string) => {
    const index = mockStore.data.mockApplicationComponents.findIndex((c) => c.get("name") === name);
    if (index >= 0) {
      mockStore.data.mockApplicationComponents = mockStore.data.mockApplicationComponents.delete(index);
      mockStore.saveData();
    }
  };

  // TODO
  public loadServices = async (name: string) => {
    return Immutable.fromJS({});
  };

  // TODO
  public deletePersistentVolume = async (name: string): Promise<void> => {};

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

  // TODO
  public getRegistry = async (name: string) => {
    return mockStore.data.mockRegistries.find((c) => c.get("name") === name)!;
  };

  // TODO
  public getServiceAccountSecret = async (name: string) => {
    return "";
  };

  // TODO
  public loadRolebindings = async () => {
    return Immutable.fromJS([]);
  };

  // TODO
  public updateHttpRoute = async (namespace: string, name: string, httpRoute: HttpRoute) => {
    const index = mockStore.data.mockHttpRoutes.findIndex((c) => c.get("name") === name);
    if (index >= 0) {
      mockStore.data.mockHttpRoutes = mockStore.data.mockHttpRoutes.update(index, httpRoute as any);
      mockStore.saveData();
    }
    return Immutable.fromJS(httpRoute);
  };

  public updateKappApplication = async (application: Application) => {
    const index = mockStore.data.mockApplications.findIndex((c) => c.get("name") === application.get("name"));
    if (index >= 0) {
      mockStore.data.mockApplications = mockStore.data.mockApplications.update(index, application as any);
      mockStore.saveData();
    }
    return Immutable.fromJS(application);
  };

  public updateKappApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    const index = mockStore.data.mockApplicationComponents.findIndex((c) => c.get("name") === component.get("name"));
    if (index >= 0) {
      mockStore.data.mockApplicationComponents = mockStore.data.mockApplicationComponents.update(
        index,
        component as any,
      );
      mockStore.saveData();
    }
    return Immutable.fromJS(component);
  };

  public updateRegistry = async (registry: RegistryType) => {
    const index = mockStore.data.mockRegistries.findIndex((c) => c.get("name") === registry.get("name"));
    if (index >= 0) {
      mockStore.data.mockRegistries = mockStore.data.mockRegistries.update(index, registry as any);
      mockStore.saveData();
    }
    return Immutable.fromJS({});
  };
}
