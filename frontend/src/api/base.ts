import Immutable from "immutable";
import {
  Application,
  ApplicationComponent,
  ApplicationComponentDetails,
  ApplicationDetails,
  ApplicationPlugin,
  ComponentPlugin,
} from "types/application";
import { LoginStatus } from "types/authorization";
import {
  Certificate,
  CertificateFormType,
  CertificateIssuer,
  CertificateIssuerFormType,
  CertificateIssuerList,
  CertificateList,
} from "types/certificate";
import { ClusterInfo } from "types/cluster";
import { NodesListResponse } from "types/node";
import { RegistryType } from "types/registry";
import { HttpRoute } from "types/route";
import { Service } from "types/service";
import { RoleBinding, RoleBindingsRequestBody } from "types/user";
import { PersistentVolumes, StorageClasses } from "types/disk";

export abstract class Api {
  public abstract getClusterInfo(): Promise<ClusterInfo>;
  public abstract getLoginStatus(): Promise<LoginStatus>;
  public abstract validateToken(token: string): Promise<boolean>;
  public abstract getNodes(): Promise<NodesListResponse>;
  public abstract getPersistentVolumes(): Promise<PersistentVolumes>;
  public abstract deletePersistentVolume(name: string): Promise<void>;
  public abstract getStorageClasses(): Promise<StorageClasses>;
  // registry
  public abstract getRegistries(): Promise<Immutable.List<RegistryType>>;
  public abstract getRegistry(name: string): Promise<RegistryType>;
  public abstract createRegistry(registry: RegistryType): Promise<RegistryType>;
  public abstract updateRegistry(registry: RegistryType): Promise<RegistryType>;
  public abstract deleteRegistry(name: string): Promise<void>;
  // applications
  public abstract getKappApplicationList(): Promise<Immutable.List<ApplicationDetails>>;
  public abstract getKappApplication(name: string): Promise<ApplicationDetails>;
  public abstract createKappApplication(application: Application): Promise<ApplicationDetails>;
  public abstract updateKappApplication(application: Application): Promise<ApplicationDetails>;
  public abstract deleteKappApplication(name: string): Promise<void>;
  public abstract getKappApplicationComponentList(
    applicationName: string,
  ): Promise<Immutable.List<ApplicationComponentDetails>>;
  public abstract getKappApplicationComponent(
    applicationName: string,
    name: string,
  ): Promise<ApplicationComponentDetails>;
  public abstract createKappApplicationComponent(
    applicationName: string,
    component: ApplicationComponent,
  ): Promise<ApplicationComponentDetails>;
  public abstract updateKappApplicationComponent(
    applicationName: string,
    component: ApplicationComponent,
  ): Promise<ApplicationComponentDetails>;
  public abstract deleteKappApplicationComponent(applicationName: string, name: string): Promise<void>;
  // plugins
  public abstract getKappApplicationPlugins(): Promise<ApplicationPlugin[]>;
  public abstract getKappComponentPlugins(): Promise<ComponentPlugin[]>;
  // routes
  public abstract getHttpRoutes(namespace: string): Promise<Immutable.List<HttpRoute>>;
  public abstract updateHttpRoute(namespace: string, name: string, httpRoute: HttpRoute): Promise<HttpRoute>;
  public abstract createHttpRoute(namespace: string, httpRoute: HttpRoute): Promise<HttpRoute>;
  public abstract deleteHttpRoute(namespace: string, name: string): Promise<boolean>;
  public abstract deletePod(namespace: string, name: string): Promise<any>;
  // RoleBindings
  public abstract loadRolebindings(): Promise<Immutable.List<RoleBinding>>;
  public abstract createRoleBindings(roleBindingRequestBody: RoleBindingsRequestBody): Promise<void>;
  public abstract deleteRoleBindings(namespace: string, bindingName: string): Promise<void>;
  public abstract getServiceAccountSecret(name: string): any;
  // certificate
  public abstract getCertificateList(): Promise<CertificateList>;
  public abstract getCertificateIssuerList(): Promise<CertificateIssuerList>;
  public abstract createCertificate(certificate: CertificateFormType, isEdit?: boolean): Promise<Certificate>;
  public abstract createCertificateIssuer(
    certificateIssuer: CertificateIssuerFormType,
    isEdit?: boolean,
  ): Promise<CertificateIssuer>;
  public abstract deleteCertificate(name: string): Promise<void>;
  // services
  public abstract loadServices(name: string): Promise<Immutable.List<Service>>;
}
