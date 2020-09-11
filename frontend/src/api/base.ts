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
  CertificateFormTypeContent,
  CertificateIssuer,
  CertificateIssuerList,
  CertificateList,
  AcmeServerInfo,
  AcmeServerFormType,
  CertificateIssuerFormTypeContent,
} from "types/certificate";
import { ClusterInfo, InitializeClusterResponse } from "types/cluster";
import { PersistentVolumes, StorageClasses, VolumeOptions } from "types/disk";
import { Node, NodesListResponse } from "types/node";
import { RegistryType } from "types/registry";
import { HttpRoute } from "types/route";
import { Service } from "types/service";
import { ProtectedEndpoint, SSOConfig } from "types/sso";
import { DeployAccessToken } from "types/deployAccessToken";
import { RoleBinding, RoleBindingContent } from "types/member";

export abstract class Api {
  public abstract getClusterInfo(): Promise<ClusterInfo>;

  public abstract getLoginStatus(): Promise<LoginStatus>;

  public abstract validateToken(token: string): Promise<boolean>;

  public abstract getNodes(): Promise<NodesListResponse>;

  public abstract cordonNode(name: string): Promise<Node>;

  public abstract uncordonNode(name: string): Promise<Node>;

  public abstract getPersistentVolumes(): Promise<PersistentVolumes>;

  public abstract deletePersistentVolume(namespace: string, name: string): Promise<void>;

  public abstract getStorageClasses(): Promise<StorageClasses>;

  public abstract getSimpleOptions(namespace: string): Promise<VolumeOptions>;

  public abstract getStatefulSetOptions(namespace: string): Promise<VolumeOptions>;

  // registry
  public abstract getRegistries(): Promise<Immutable.List<RegistryType>>;

  public abstract getRegistry(name: string): Promise<RegistryType>;

  public abstract createRegistry(registry: RegistryType): Promise<RegistryType>;

  public abstract updateRegistry(registry: RegistryType): Promise<RegistryType>;

  public abstract deleteRegistry(name: string): Promise<void>;

  // applications
  public abstract getApplicationList(): Promise<Immutable.List<ApplicationDetails>>;

  public abstract getApplication(name: string): Promise<ApplicationDetails>;

  public abstract createApplication(application: Application): Promise<ApplicationDetails>;

  public abstract updateApplication(application: Application): Promise<ApplicationDetails>;

  public abstract deleteApplication(name: string): Promise<void>;

  public abstract getApplicationComponentList(
    applicationName: string,
  ): Promise<Immutable.List<ApplicationComponentDetails>>;

  public abstract getApplicationComponent(applicationName: string, name: string): Promise<ApplicationComponentDetails>;

  public abstract createApplicationComponent(
    applicationName: string,
    component: ApplicationComponent,
  ): Promise<ApplicationComponentDetails>;

  public abstract updateApplicationComponent(
    applicationName: string,
    component: ApplicationComponent,
  ): Promise<ApplicationComponentDetails>;

  public abstract deleteApplicationComponent(applicationName: string, name: string): Promise<void>;

  // plugins
  public abstract getApplicationPlugins(): Promise<ApplicationPlugin[]>;

  public abstract getComponentPlugins(): Promise<ComponentPlugin[]>;

  // routes
  public abstract getHttpRoutes(): Promise<Immutable.List<HttpRoute>>;

  public abstract updateHttpRoute(httpRoute: HttpRoute): Promise<HttpRoute>;

  public abstract createHttpRoute(httpRoute: HttpRoute): Promise<HttpRoute>;

  public abstract deleteHttpRoute(httpRoute: HttpRoute): Promise<boolean>;

  public abstract deletePod(namespace: string, name: string): Promise<any>;

  // RoleBindings
  public abstract loadRoleBindings(): Promise<Immutable.List<RoleBinding>>;

  public abstract createRoleBinding(roleBinding: RoleBindingContent): Promise<void>;

  public abstract updateRoleBinding(roleBinding: RoleBindingContent): Promise<void>;

  public abstract deleteRoleBinding(namespace: string, bindingName: string): Promise<void>;

  // certificate
  public abstract getCertificateList(): Promise<CertificateList>;

  public abstract getCertificateIssuerList(): Promise<CertificateIssuerList>;

  public abstract createCertificate(certificate: CertificateFormTypeContent, isEdit?: boolean): Promise<Certificate>;

  public abstract createCertificateIssuer(
    certificateIssuer: CertificateIssuerFormTypeContent,
    isEdit?: boolean,
  ): Promise<CertificateIssuer>;

  public abstract deleteCertificate(name: string): Promise<void>;

  // certificate acme server
  public abstract createAcmeServer(acmeServer: AcmeServerFormType): Promise<AcmeServerInfo>;

  public abstract deleteAcmeServer(acmeServer: AcmeServerFormType): Promise<void>;

  public abstract getAcmeServer(): Promise<AcmeServerInfo>;

  // services
  public abstract loadServices(name: string): Promise<Immutable.List<Service>>;

  // SSOConfig
  public abstract getSSOConfig(): Promise<SSOConfig>;

  public abstract createSSOConfig(ssoConfig: SSOConfig): Promise<SSOConfig>;

  public abstract updateSSOConfig(ssoConfig: SSOConfig): Promise<SSOConfig>;

  public abstract deleteSSOConfig(): Promise<void>;

  public abstract listProtectedEndpoints(): Promise<Immutable.List<ProtectedEndpoint>>;

  public abstract createProtectedEndpoint(protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint>;

  public abstract updateProtectedEndpoint(protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint>;

  public abstract deleteProtectedEndpoint(protectedEndpoint: ProtectedEndpoint): Promise<void>;

  public abstract listDeployAccessTokens(): Promise<Immutable.List<DeployAccessToken>>;

  public abstract createDeployAccessToken(protectedEndpoint: DeployAccessToken): Promise<DeployAccessToken>;

  public abstract deleteDeployAccessToken(protectedEndpoint: DeployAccessToken): Promise<void>;

  public abstract resolveDomain(domain: string, type: "A" | "CNAME", timeout?: number): Promise<string[]>;

  public abstract initializeCluster(domain: string): Promise<InitializeClusterResponse>;

  public abstract resetCluster(): Promise<any>;
}
