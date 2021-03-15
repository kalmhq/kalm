import Axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import { store } from "store";
import { Application, ApplicationComponent } from "types/application";
import { AcmeServerFormType, AcmeServerInfo, CertificateFormType, CertificateIssuerFormType } from "types/certificate";
import { InitializeClusterResponse } from "types/cluster";
import {
  AccessTokenToDeployAccessToken,
  DeployAccessToken,
  DeployAccessTokenToAccessToken,
} from "types/deployAccessToken";
import { GoogleDNSARecordResponse, GoogleDNSCNAMEResponse } from "types/dns";
import { Domain, DomainCreation } from "types/domains";
import { RoleBinding } from "types/member";
import { Node } from "types/node";
import { Registry, RegistryFormType } from "types/registry";
import { HttpRoute } from "types/route";
import { ProtectedEndpoint, SSOConfig } from "types/sso";

export default class RealApi {
  public getClusterInfo = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/cluster` });
    return res.data;
  };

  public getLoginStatus = async () => {
    const res = await axiosRequest({ method: "get", url: "/login/status" });
    return res.data;
  };

  public oidcLogout = async () => {
    const res = await axiosRequest({ method: "get", url: "/oidc/logout" });
    return res.data;
  };

  public validateToken = async (token: string): Promise<boolean> => {
    const res = await axiosRequest(
      { method: "post", url: "/login/token", headers: { Authorization: "Bearer " + token } },
      false,
    );
    return res.status === 200;
  };

  public getNodes = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/nodes` });
    return res.data;
  };

  public cordonNode = async (name: string): Promise<Node> => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/nodes/${name}/cordon` });
    return res.data;
  };

  public uncordonNode = async (name: string): Promise<Node> => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/nodes/${name}/uncordon` });
    return res.data;
  };

  public getPersistentVolumes = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/volumes` });
    return res.data;
  };

  public deletePersistentVolume = async (namespace: string, name: string): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/volumes/${namespace}/${name}` });
  };

  public getStorageClasses = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/storageclasses` });
    return res.data;
  };

  public getSimpleOptions = async (namespace: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/volumes/available/simple-workload?currentNamespace=${namespace}`,
    });
    return res.data;
  };

  public getStatefulSetOptions = async (namespace: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/volumes/available/sts/${namespace}`,
    });
    return res.data;
  };

  // registry

  public getRegistries = async (): Promise<Registry[]> => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/registries` });
    return res.data;
  };

  public getRegistry = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/registries/${name}` });
    return res.data;
  };

  public createRegistry = async (registry: RegistryFormType): Promise<Registry> => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/registries`,
      data: registry,
    });
    return res.data;
  };

  public updateRegistry = async (registry: RegistryFormType): Promise<Registry> => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/registries/${registry.name}`,
      data: registry,
    });
    return res.data;
  };

  public deleteRegistry = async (name: string) => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/registries/${name}` });
  };

  // applications

  public getApplicationList = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/applications` });
    return res.data;
  };

  public getApplication = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/applications/${name}` });
    return res.data;
  };

  public createApplication = async (application: Application) => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/applications`,
      data: application,
    });
    return res.data;
  };

  public updateApplication = async (application: Application) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/applications/${application.name}`,
      data: application,
    });
    return res.data;
  };

  public deleteApplication = async (name: string): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/applications/${name}` });
  };

  public getApplicationComponentList = async (applicationName: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/applications/${applicationName}/components`,
    });
    return res.data;
  };

  public getApplicationComponent = async (applicationName: string, name: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${name}`,
    });
    return res.data;
  };

  public createApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/applications/${applicationName}/components`,
      data: component,
    });
    return res.data;
  };

  public updateApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${component.name}`,
      data: component,
    });
    return res.data;
  };

  public deleteApplicationComponent = async (applicationName: string, name: string) => {
    await axiosRequest({
      method: "delete",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${name}`,
    });
  };

  public triggerApplicationComponentJob = async (applicationName: string, componentName: string) => {
    await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${componentName}/jobs`,
      data: {},
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
    return res.data;
  };

  public updateHttpRoute = async (httpRoute: HttpRoute) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/httproutes/${httpRoute.name}`,
      data: httpRoute,
    });
    return res.data;
  };

  public createHttpRoute = async (httpRoute: HttpRoute) => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/httproutes`,
      data: httpRoute,
    });
    return res.data;
  };

  public deleteHttpRoute = async (httpRoute: HttpRoute) => {
    const res = await axiosRequest({
      method: "delete",
      url: `/${K8sApiVersion}/httproutes/${httpRoute.name}`,
    });
    return res.status === 200;
  };

  public deletePod = async (namespace: string, name: string) => {
    return await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/pods/${namespace}/${name}` });
  };

  public deleteJob = async (namespace: string, name: string) => {
    return await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/jobs/${namespace}/${name}` });
  };

  // RoleBindings

  public loadRoleBindings = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/rolebindings` });
    return res.data;
  };

  public createRoleBinding = async (roleBinding: RoleBinding) => {
    await axiosRequest({ method: "post", url: `/${K8sApiVersion}/rolebindings`, data: roleBinding });
  };

  public updateRoleBinding = async (roleBinding: RoleBinding) => {
    await axiosRequest({ method: "put", url: `/${K8sApiVersion}/rolebindings`, data: roleBinding });
  };

  public deleteRoleBinding = async (namespace: string, bindingName: string) => {
    await axiosRequest({
      method: "delete",
      url: `/${K8sApiVersion}/rolebindings/` + namespace + "/" + bindingName,
    });
  };

  public getServiceAccountSecret = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/serviceaccounts/` + name });
    return res.data;
  };

  // certificate

  public getCertificateList = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/httpscerts` });
    return res.data;
  };

  public getCertificateIssuerList = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/httpscertissuers` });
    return res.data;
  };

  public createCertificate = async (certificate: CertificateFormType, isEdit?: boolean) => {
    let res;
    if (isEdit) {
      res = await axiosRequest({
        method: "put",
        url: `/${K8sApiVersion}/httpscerts/${certificate.name}`,
        data: certificate,
      });
    } else if (certificate.isSelfManaged) {
      res = await axiosRequest({
        method: "post",
        url: `/${K8sApiVersion}/httpscerts/upload`,
        data: certificate,
      });
    } else {
      res = await axiosRequest({
        method: "post",
        url: `/${K8sApiVersion}/httpscerts`,
        data: certificate,
      });
    }

    return res.data;
  };

  public createCertificateIssuer = async (certificateIssuer: CertificateIssuerFormType, isEdit?: boolean) => {
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
    return res.data;
  };

  public deleteCertificate = async (name: string) => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/httpscerts/${name}` });
  };

  public setAcmeServer = async (acmeServer: AcmeServerFormType): Promise<void> => {
    await axiosRequest({ method: "post", url: `/${K8sApiVersion}/acmeserver`, data: acmeServer });
    return; //Immutable.fromJS(res.data);
  };

  public deleteAcmeServer = async (): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/acmeserver` });
    return;
  };

  public getAcmeServer = async (): Promise<AcmeServerInfo> => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/acmeserver` });
    return res.data;
  };

  // services

  public loadServices = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/services` });
    return res.data;
  };

  public async deleteDomain(name: string) {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/domains/${name}` });
  }

  public async createDomain(domainCreation: DomainCreation) {
    const res = await axiosRequest<Domain>({
      method: "post",
      url: `/${K8sApiVersion}/domains`,
      data: domainCreation,
    });
    return res.data;
  }

  public async triggerDomainCheck(name: string, dnsTargetReadyToCheck: boolean, txtReadyToCheck: boolean) {
    const res = await axiosRequest<Domain>({
      method: "put",
      url: `/${K8sApiVersion}/domains/${name}`,
      data: {
        dnsTargetReadyToCheck,
        txtReadyToCheck,
      },
    });
    return res.data;
  }

  public async loadDomains(): Promise<Domain[]> {
    const res = await axiosRequest<Domain[]>({
      method: "get",
      url: `/${K8sApiVersion}/domains`,
    });

    return res.data;
  }

  // sso
  public getSSOConfig = async (): Promise<SSOConfig> => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/sso` });
    return res.data;
  };

  public createSSOConfig = async (ssoConfig: SSOConfig): Promise<SSOConfig> => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/sso`, data: ssoConfig });
    return res.data;
  };

  public updateSSOConfig = async (ssoConfig: SSOConfig): Promise<SSOConfig> => {
    const res = await axiosRequest({ method: "put", url: `/${K8sApiVersion}/sso`, data: ssoConfig });
    return res.data;
  };

  public deleteSSOConfig = async (): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/sso` });
  };

  public deleteSSOTemporaryAdminUser = async (): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/sso/temporary_admin_user` });
  };

  public listProtectedEndpoints = async (): Promise<ProtectedEndpoint[]> => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/protectedendpoints` });
    return res.data;
  };

  public createProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint> => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/protectedendpoints`,
      data: protectedEndpoint,
    });

    return res.data;
  };

  public updateProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<ProtectedEndpoint> => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/protectedendpoints`,
      data: protectedEndpoint,
    });

    return res.data;
  };

  public deleteProtectedEndpoint = async (protectedEndpoint: ProtectedEndpoint): Promise<void> => {
    await axiosRequest({
      method: "delete",
      url: `/${K8sApiVersion}/protectedendpoints`,
      data: protectedEndpoint,
    });
  };

  public listDeployAccessTokens = async (): Promise<DeployAccessToken[]> => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/deploy_access_tokens` });
    return res.data.map(AccessTokenToDeployAccessToken);
  };

  public createDeployAccessToken = async (deployAccessToken: DeployAccessToken): Promise<DeployAccessToken> => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/deploy_access_tokens`,
      data: DeployAccessTokenToAccessToken(deployAccessToken),
    });

    return AccessTokenToDeployAccessToken(res.data);
  };

  public deleteDeployAccessToken = async (deployAccessToken: DeployAccessToken): Promise<void> => {
    await axiosRequest({
      method: "delete",
      url: `/${K8sApiVersion}/deploy_access_tokens`,
      data: DeployAccessTokenToAccessToken(deployAccessToken),
    });
  };

  public resolveDomain = async (domain: string, type: "A" | "CNAME", timeout: number = 5000): Promise<string[]> => {
    const res = await Axios.get(`https://dns.google.com/resolve?name=${domain}&type=${type}`, {
      timeout,
    });

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

    return res.data;
  };

  public resetCluster = async (): Promise<any> => {
    await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/reset`,
    });
  };
}

export const IMPERSONATION_KEY = "KALM_IMPERSONATION";

export const generateKalmImpersonation = (subject: string, subjectType: string) => {
  return `subject=${subject}; type=${subjectType}`;
};

export const impersonate = (subject: string, subjectType: string) => {
  window.localStorage.setItem(IMPERSONATION_KEY, generateKalmImpersonation(subject, subjectType));
  window.location.href = "/";
};

export const stopImpersonating = (redirect: boolean = true) => {
  const data = window.localStorage.getItem(IMPERSONATION_KEY) || "";
  window.localStorage.removeItem(IMPERSONATION_KEY);

  if (!redirect) {
    return;
  }

  const match = data.match(/subject=(.*)?; /);

  if (!match) {
    window.location.href = "/";
    return;
  }

  const email = match[1];
  window.location.href = "/members/" + email;
};

export const K8sApiPrefix = process.env.REACT_APP_K8S_API_PERFIX;
export const K8sApiVersion = process.env.REACT_APP_K8S_API_VERSION;
export const k8sWsPrefix = !K8sApiPrefix
  ? window.location.origin.replace(/^http/, "ws")
  : K8sApiPrefix.replace(/^http/, "ws");

const getAxiosClient = (withHeaderToken: boolean) => {
  const token = store.getState().auth.token;
  const headers: { [key: string]: string } = {};
  const useToken = withHeaderToken && !!token;

  if (useToken) {
    headers.Authorization = `Bearer ${token}`;
  }

  const impersonation = window.localStorage.getItem(IMPERSONATION_KEY);

  if (!!impersonation) {
    headers["Kalm-Impersonation"] = impersonation!;
  }

  const instance = Axios.create({
    timeout: 10000,
    withCredentials: !useToken,
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

const axiosRequest = <T = any>(config: AxiosRequestConfig, withHeaderToken: boolean = true): AxiosPromise<T> => {
  const client = getAxiosClient(withHeaderToken);

  return client({
    ...config,
    url: `${K8sApiPrefix}${config.url}`,
  });
};
