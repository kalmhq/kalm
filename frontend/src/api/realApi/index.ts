import Axios, { AxiosRequestConfig } from "axios";
import Immutable from "immutable";
import { store } from "store";
import { Application, ApplicationComponent } from "types/application";

import {
  CertificateFormTypeContent,
  CertificateIssuerFormTypeContent,
  AcmeServerInfo,
  AcmeServerFormType,
  AcmeServerFormTypeContent,
} from "types/certificate";
import { InitializeClusterResponse } from "types/cluster";
import { DeployKeyFormType, DeployKeyFormTypeContent } from "types/deployKey";
import { GoogleDNSARecordResponse, GoogleDNSCNAMEResponse } from "types/dns";
import { Node } from "types/node";
import { RegistryType } from "types/registry";
import { HttpRoute } from "types/route";
import { ProtectedEndpoint, SSOConfig } from "types/sso";
import { RoleBindingsRequestBody } from "types/user";
import { Api } from "../base";

export const mockStore = null;

export default class RealApi extends Api {
  public getClusterInfo = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/cluster` });
    return Immutable.fromJS(res.data);
  };

  public getLoginStatus = async () => {
    const res = await axiosRequest({ method: "get", url: "/login/status" });
    return Immutable.fromJS(res.data);
  };

  public validateToken = async (token: string): Promise<boolean> => {
    const res = await axiosRequest({ method: "post", url: "/login/token", data: { token } }, false);
    return res.status === 200;
  };

  public getNodes = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/nodes` });
    return Immutable.fromJS(res.data);
  };

  public cordonNode = async (name: string): Promise<Node> => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/nodes/${name}/cordon` });
    return Immutable.fromJS(res.data);
  };

  public uncordonNode = async (name: string): Promise<Node> => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/nodes/${name}/uncordon` });
    return Immutable.fromJS(res.data);
  };

  public getPersistentVolumes = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/volumes` });
    return Immutable.fromJS(res.data);
  };

  public deletePersistentVolume = async (namespace: string, name: string): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/volumes/${namespace}/${name}` });
  };

  public getStorageClasses = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/storageclasses` });
    return Immutable.fromJS(res.data);
  };

  public getSimpleOptions = async (namespace: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/volumes/available/simple-workload?currentNamespace=${namespace}`,
    });
    return Immutable.fromJS(res.data);
  };

  public getStatefulSetOptions = async (namespace: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/volumes/available/sts/${namespace}`,
    });
    return Immutable.fromJS(res.data);
  };

  // registry

  public getRegistries = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/registries` });
    return Immutable.fromJS(res.data);
  };

  public getRegistry = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/registries/${name}` });
    return Immutable.fromJS(res.data);
  };

  public createRegistry = async (registry: RegistryType) => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/registries`, data: registry });
    return Immutable.fromJS(res.data);
  };

  public updateRegistry = async (registry: RegistryType) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/registries/${registry.get("name")}`,
      data: registry,
    });
    return Immutable.fromJS(res.data);
  };

  public deleteRegistry = async (name: string) => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/registries/${name}` });
  };

  // applications

  public getApplicationList = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/applications` });
    return Immutable.fromJS(res.data);
  };

  public getApplication = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/applications/${name}` });
    return Immutable.fromJS(res.data);
  };

  public createApplication = async (application: Application) => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/applications`, data: application });
    return Immutable.fromJS(res.data);
  };

  public updateApplication = async (application: Application) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/applications/${application.get("name")}`,
      data: application,
    });
    return Immutable.fromJS(res.data);
  };

  public deleteApplication = async (name: string): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/applications/${name}` });
  };

  public getApplicationComponentList = async (applicationName: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/applications/${applicationName}/components`,
    });
    return Immutable.fromJS(res.data);
  };

  public getApplicationComponent = async (applicationName: string, name: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${name}`,
    });
    return Immutable.fromJS(res.data);
  };

  public createApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/applications/${applicationName}/components`,
      data: component,
    });
    return Immutable.fromJS(res.data);
  };

  public updateApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${component.get("name")}`,
      data: component,
    });
    return Immutable.fromJS(res.data);
  };

  public deleteApplicationComponent = async (applicationName: string, name: string) => {
    await axiosRequest({
      method: "delete",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${name}`,
    });
  };

  // plugins

  public getApplicationPlugins = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/applicationplugins` });
    return res.data;
  };

  public getComponentPlugins = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/componentplugins` });
    return res.data;
  };

  // routes

  public getHttpRoutes = async () => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/httproutes`,
    });
    return Immutable.fromJS(res.data);
  };

  public updateHttpRoute = async (httpRoute: HttpRoute) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/httproutes/${httpRoute.get("namespace")}/${httpRoute.get("name")}`,
      data: httpRoute,
    });
    return Immutable.fromJS(res.data);
  };

  public createHttpRoute = async (httpRoute: HttpRoute) => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/httproutes/${httpRoute.get("namespace")}`,
      data: httpRoute,
    });
    return Immutable.fromJS(res.data);
  };

  public deleteHttpRoute = async (httpRoute: HttpRoute) => {
    const res = await axiosRequest({
      method: "delete",
      url: `/${K8sApiVersion}/httproutes/${httpRoute.get("namespace")}/${httpRoute.get("name")}`,
    });
    return res.status === 200;
  };

  public deletePod = async (namespace: string, name: string) => {
    return await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/pods/${namespace}/${name}` });
  };

  // RoleBindings

  public loadRolebindings = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/rolebindings` });
    return Immutable.fromJS(res.data.roleBindings);
  };

  public createRoleBindings = async (roleBindingRequestBody: RoleBindingsRequestBody) => {
    await axiosRequest({ method: "post", url: `/${K8sApiVersion}/rolebindings`, data: roleBindingRequestBody });
  };

  public deleteRoleBindings = async (namespace: string, bindingName: string) => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/rolebindings/` + namespace + "/" + bindingName });
  };

  public getServiceAccountSecret = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/serviceaccounts/` + name });
    return res.data;
  };

  // certificate

  public getCertificateList = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/httpscerts` });
    return Immutable.fromJS(res.data);
  };

  public getCertificateIssuerList = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/httpscertissuers` });
    return Immutable.fromJS(res.data);
  };

  public createCertificate = async (certificate: CertificateFormTypeContent, isEdit?: boolean) => {
    let res;
    if (isEdit) {
      res = await axiosRequest({
        method: "put",
        url: `/${K8sApiVersion}/httpscerts/${certificate.name}`,
        data: certificate,
      });
    } else if (certificate.isSelfManaged) {
      res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/httpscerts/upload`, data: certificate });
    } else {
      res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/httpscerts`, data: certificate });
    }

    return Immutable.fromJS(res.data);
  };

  public createCertificateIssuer = async (certificateIssuer: CertificateIssuerFormTypeContent, isEdit?: boolean) => {
    let res;
    if (isEdit) {
      res = await axiosRequest({
        method: "put",
        url: `/${K8sApiVersion}/httpscertissuers/${certificateIssuer.name}`,
        data: certificateIssuer,
      });
    } else {
      res = await axiosRequest({
        method: "post",
        url: `/${K8sApiVersion}/httpscertissuers`,
        data: { certificateIssuer },
      });
    }
    return Immutable.fromJS(res.data);
  };

  public deleteCertificate = async (name: string) => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/httpscerts/${name}` });
  };

  // certificate acme server
  public createAcmeServer = async (acmeServer: AcmeServerFormType): Promise<AcmeServerInfo> => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/acmeserver`, data: acmeServer });

    return Immutable.fromJS(res.data);
  };

  public editAcmeServer = async (acmeServer: AcmeServerFormTypeContent): Promise<void> => {
    await axiosRequest({ method: "put", url: `/${K8sApiVersion}/acmeserver`, data: acmeServer });
    return; //Immutable.fromJS(res.data);
  };

  public deleteAcmeServer = async (acmeServer: AcmeServerFormType): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/acmeserver`, data: acmeServer });
    return;
  };

  public getAcmeServer = async (): Promise<AcmeServerInfo> => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/acmeserver` });
    return Immutable.fromJS(res.data);
  };

  // services

  public loadServices = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/services` });
    return Immutable.fromJS(res.data);
  };

  // sso
  public getSSOConfig = async (): Promise<SSOConfig> => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/sso` });
    return Immutable.fromJS(res.data);
  };

  public createSSOConfig = async (ssoConfig: SSOConfig): Promise<SSOConfig> => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/sso`, data: ssoConfig });
    return Immutable.fromJS(res.data);
  };

  public updateSSOConfig = async (ssoConfig: SSOConfig): Promise<SSOConfig> => {
    const res = await axiosRequest({ method: "put", url: `/${K8sApiVersion}/sso`, data: ssoConfig });
    return Immutable.fromJS(res.data);
  };

  public deleteSSOConfig = async (): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/sso` });
  };

  public listProtectedEndpoints = async (): Promise<Immutable.List<ProtectedEndpoint>> => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/protectedendpoints` });
    return Immutable.fromJS(res.data);
  };

  public createProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint> => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/protectedendpoints`,
      data: protectedEndpoint,
    });

    return Immutable.fromJS(res.data);
  };

  public updateProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint> => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/protectedendpoints`,
      data: protectedEndpoint,
    });

    return Immutable.fromJS(res.data);
  };

  public deleteProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/protectedendpoints`, data: protectedEndpoint });
  };

  public listDeployKeys = async (): Promise<Immutable.List<DeployKeyFormType>> => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/deploykeys` });
    return Immutable.fromJS(res.data);
  };

  public createDeployKey = async (deployKey: DeployKeyFormTypeContent): Promise<DeployKeyFormType> => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/deploykeys`,
      data: deployKey,
    });

    return Immutable.fromJS(res.data);
  };

  public deleteDeployKey = async (deployKey: DeployKeyFormType): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/deploykeys`, data: deployKey });
  };

  public resolveDomain = async (domain: string, type: "A" | "CNAME", timeout: number = 5000): Promise<string[]> => {
    const res = await Axios.get(`https://dns.google.com/resolve?name=${domain}&type=${type}`, { timeout });

    if (res.data.Answer) {
      return (res.data.Answer as GoogleDNSARecordResponse[]).map((aRecord) => aRecord.data);
    } else if (res.data.Authority) {
      return [(res.data.Authority as GoogleDNSCNAMEResponse[])[0].data];
    }

    return [];
  };

  public initializeCluster = async (domain: string): Promise<InitializeClusterResponse> => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/initialize`,
      data: { domain },
    });

    return Immutable.fromJS(res.data);
  };

  public resetCluster = async (): Promise<any> => {
    await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/reset`,
    });
  };
}

export const K8sApiPrefix = process.env.REACT_APP_K8S_API_PERFIX;
export const K8sApiVersion = process.env.REACT_APP_K8S_API_VERSION;
export const k8sWsPrefix = !K8sApiPrefix
  ? window.location.origin.replace(/^http/, "ws")
  : K8sApiPrefix.replace(/^http/, "ws");

const getAxiosClient = (withHeaderToken: boolean) => {
  const token = store.getState().get("auth").get("token");
  const headers: { [key: string]: string } = {};

  if (withHeaderToken && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const instance = Axios.create({
    timeout: 10000,
    withCredentials: true,
    headers: headers,
  });

  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  return instance;
};

const axiosRequest = (config: AxiosRequestConfig, withHeaderToken: boolean = true) => {
  return getAxiosClient(withHeaderToken)({
    ...config,
    url: `${K8sApiPrefix}${config.url}`,
  });
};
