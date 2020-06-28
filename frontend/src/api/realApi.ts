import Immutable from "immutable";
import { Api } from "./base";
import { store } from "store";
import Axios, { AxiosRequestConfig } from "axios";
import { RegistryType } from "types/registry";
import { Application, ApplicationComponent } from "types/application";
import { HttpRoute } from "types/route";
import { RoleBindingsRequestBody } from "types/user";
import { CertificateFormType, CertificateIssuerFormType } from "types/certificate";

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
    const res = await axiosRequest({ method: "post", url: "/login/token", data: token });
    return res.status === 200;
  };

  public getNodes = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/nodes` });
    return Immutable.fromJS(res.data);
  };

  public getPersistentVolumes = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/volumes` });
    return Immutable.fromJS(res.data);
  };

  public deletePersistentVolume = async (name: string): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/volumes/${name}` });
  };

  public getStorageClasses = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/storageclasses` });
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

  public getKappApplicationList = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/applications` });
    return Immutable.fromJS(res.data);
  };

  public getKappApplication = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/applications/${name}` });
    return Immutable.fromJS(res.data);
  };

  public createKappApplication = async (application: Application) => {
    const res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/applications`, data: application });
    return Immutable.fromJS(res.data);
  };

  public updateKappApplication = async (application: Application) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/applications/${application.get("name")}`,
      data: application,
    });
    return Immutable.fromJS(res.data);
  };

  public deleteKappApplication = async (name: string): Promise<void> => {
    await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/applications/${name}` });
  };

  public getKappApplicationComponentList = async (applicationName: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/applications/${applicationName}/components`,
    });
    return Immutable.fromJS(res.data);
  };

  public getKappApplicationComponent = async (applicationName: string, name: string) => {
    const res = await axiosRequest({
      method: "get",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${name}`,
    });
    return Immutable.fromJS(res.data);
  };

  public createKappApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/applications/${applicationName}/components`,
      data: component,
    });
    return Immutable.fromJS(res.data);
  };

  public updateKappApplicationComponent = async (applicationName: string, component: ApplicationComponent) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${component.get("name")}`,
      data: component,
    });
    return Immutable.fromJS(res.data);
  };

  public deleteKappApplicationComponent = async (applicationName: string, name: string) => {
    await axiosRequest({
      method: "delete",
      url: `/${K8sApiVersion}/applications/${applicationName}/components/${name}`,
    });
  };

  // plugins

  public getKappApplicationPlugins = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/applicationplugins` });
    console.log(JSON.stringify(res.data));
    return res.data;
  };

  public getKappComponentPlugins = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/componentplugins` });
    console.log(JSON.stringify(res.data));
    return res.data;
  };

  // routes

  public getHttpRoutes = async (namespace: string) => {
    const res = await axiosRequest({
      method: "get",
      url: !!namespace ? `/${K8sApiVersion}/httproutes/${namespace}` : `/${K8sApiVersion}/httproutes`,
    });
    return Immutable.fromJS(res.data);
  };

  public updateHttpRoute = async (namespace: string, name: string, httpRoute: HttpRoute) => {
    const res = await axiosRequest({
      method: "put",
      url: `/${K8sApiVersion}/httproutes/${namespace}/${name}`,
      data: httpRoute,
    });
    return Immutable.fromJS(res.data);
  };

  public createHttpRoute = async (namespace: string, httpRoute: HttpRoute) => {
    const res = await axiosRequest({
      method: "post",
      url: `/${K8sApiVersion}/httproutes/${namespace}`,
      data: httpRoute,
    });
    return Immutable.fromJS(res.data);
  };

  public deleteHttpRoute = async (namespace: string, name: string) => {
    const res = await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/httproutes/${namespace}/${name}` });
    return res.status === 200;
  };

  public deletePod = async (namespace: string, name: string) => {
    return await axiosRequest({ method: "delete", url: `/${K8sApiVersion}/pods/${namespace}/${name}` });
  };

  // RoleBindings

  public loadRolebindings = async () => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/rolebindings` });
    console.log(JSON.stringify(res.data));
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
    console.log(JSON.stringify(res.data));
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

  public createCertificate = async (certificate: CertificateFormType, isEdit?: boolean) => {
    let res;
    if (isEdit) {
      res = await axiosRequest({
        method: "put",
        url: `/${K8sApiVersion}/httpscerts/${certificate.get("name")}`,
        data: certificate,
      });
    } else if (certificate.get("isSelfManaged")) {
      res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/httpscerts/upload`, data: certificate });
    } else {
      res = await axiosRequest({ method: "post", url: `/${K8sApiVersion}/httpscerts`, data: certificate });
    }

    return Immutable.fromJS(res.data);
  };

  public createCertificateIssuer = async (certificateIssuer: CertificateIssuerFormType, isEdit?: boolean) => {
    let res;
    if (isEdit) {
      res = await axiosRequest({
        method: "put",
        url: `/${K8sApiVersion}/httpscertissuers/${certificateIssuer.get("name")}`,
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

  // services

  public loadServices = async (name: string) => {
    const res = await axiosRequest({ method: "get", url: `/${K8sApiVersion}/services` });
    console.log(JSON.stringify(res.data));
    return Immutable.fromJS(res.data);
  };
}

export const K8sApiPrefix = process.env.REACT_APP_K8S_API_PERFIX;
export const K8sApiVersion = process.env.REACT_APP_K8S_API_VERSION;
export const k8sWsPrefix = !K8sApiPrefix
  ? window.location.origin.replace(/^http/, "ws")
  : K8sApiPrefix.replace(/^http/, "ws");

const getAxiosClient = () => {
  const token = store.getState().get("auth").get("token");

  const instance = token
    ? Axios.create({
        timeout: 10000,
        withCredentials: true,
        headers: {
          "X-CSRF-Token": store.getState().get("auth").get("csrf"),
          Authorization: `Bearer ${store.getState().get("auth").get("token")}`,
        },
      })
    : Axios;

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

const axiosRequest = (config: AxiosRequestConfig) => {
  return getAxiosClient()({
    ...config,
    url: `${K8sApiPrefix}${config.url}`,
  });
};
