import { Application, ApplicationComponent, ApplicationComponentDetails, ApplicationDetails } from "types/application";
import { LoginStatus } from "types/authorization";
import { Certificate, CertificateIssuer, CertificateIssuerForm, CertificateForm } from "types/certificate";
import { ClusterInfo, InitializeClusterResponse } from "types/cluster";
import { DeployKey } from "types/deployKey";
import { PersistentVolumes, StorageClasses, VolumeOptions } from "types/disk";
import { Node, NodesListResponse } from "types/node";
import { RegistryFormType, Registry } from "types/registry";
import { HttpRoute } from "types/route";
import { Service } from "types/service";
import { ProtectedEndpoint, SSOConfig } from "types/sso";

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
  public abstract getRegistries(): Promise<Registry[]>;

  public abstract getRegistry(name: string): Promise<Registry>;

  public abstract createRegistry(registry: RegistryFormType): Promise<Registry>;

  public abstract updateRegistry(registry: RegistryFormType): Promise<Registry>;

  public abstract deleteRegistry(name: string): Promise<void>;

  // applications
  public abstract getApplicationList(): Promise<ApplicationDetails[]>;

  public abstract getApplication(name: string): Promise<ApplicationDetails>;

  public abstract createApplication(application: Application): Promise<ApplicationDetails>;

  public abstract updateApplication(application: Application): Promise<ApplicationDetails>;

  public abstract deleteApplication(name: string): Promise<void>;

  public abstract getApplicationComponentList(applicationName: string): Promise<ApplicationComponentDetails[]>;

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

  // routes
  public abstract getHttpRoutes(): Promise<HttpRoute[]>;

  public abstract updateHttpRoute(httpRoute: HttpRoute): Promise<HttpRoute>;

  public abstract createHttpRoute(httpRoute: HttpRoute): Promise<HttpRoute>;

  public abstract deleteHttpRoute(httpRoute: HttpRoute): Promise<boolean>;

  public abstract deletePod(namespace: string, name: string): Promise<any>;

  public abstract getServiceAccountSecret(name: string): any;

  // certificate
  public abstract getCertificateList(): Promise<Certificate[]>;

  public abstract getCertificateIssuerList(): Promise<CertificateIssuer[]>;

  public abstract createCertificate(certificate: CertificateForm, isEdit?: boolean): Promise<Certificate>;

  public abstract createCertificateIssuer(
    certificateIssuer: CertificateIssuerForm,
    isEdit?: boolean,
  ): Promise<CertificateIssuer>;

  public abstract deleteCertificate(name: string): Promise<void>;

  // services
  public abstract loadServices(name: string): Promise<Service[]>;

  // SSOConfig
  public abstract getSSOConfig(): Promise<SSOConfig>;

  public abstract createSSOConfig(ssoConfig: SSOConfig): Promise<SSOConfig>;

  public abstract updateSSOConfig(ssoConfig: SSOConfig): Promise<SSOConfig>;

  public abstract deleteSSOConfig(): Promise<void>;

  public abstract listProtectedEndpoints(): Promise<ProtectedEndpoint[]>;

  public abstract createProtectedEndpoint(protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint>;

  public abstract updateProtectedEndpoint(protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint>;

  public abstract deleteProtectedEndpoint(protectedEndpoint: ProtectedEndpoint): Promise<void>;

  public abstract listDeployKeys(): Promise<DeployKey[]>;

  public abstract createDeployKey(deployKey: DeployKey): Promise<DeployKey>;

  public abstract deleteDeployKey(deployKey: DeployKey): Promise<void>;

  public abstract resolveDomain(domain: string, type: "A" | "CNAME", timeout?: number): Promise<string[]>;

  public abstract initializeCluster(domain: string): Promise<InitializeClusterResponse>;

  public abstract resetCluster(): Promise<any>;
}
