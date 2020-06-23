import axios from "axios";
import Immutable from "immutable";
import { LoginStatus, LoginStatusContent } from "types/authorization";
import { NodesListResponse } from "types/node";
import { RoleBinding, RoleBindingsRequestBody } from "types/user";
import { store } from "../store";
import {
  Application,
  ApplicationComponent,
  ApplicationComponentDetails,
  ApplicationDetails,
  ApplicationPlugin,
  ComponentPlugin,
} from "../types/application";
import { RegistryType } from "types/registry";
import {
  Certificate,
  CertificateFormType,
  CertificateIssuer,
  CertificateIssuerFormType,
  CertificateIssuerList,
  CertificateList,
} from "types/certificate";
import { HttpRoute } from "types/route";
import { Service } from "types/service";
import { PersistentVolumes, StorageClasses } from "../types/persistentVolume";
import { ClusterInfo } from "types/cluster";
import { certificateListData } from "./mockApiData";

export const K8sApiPrefix = process.env.REACT_APP_K8S_API_PERFIX;
export const k8sWsPrefix = !K8sApiPrefix
  ? window.location.origin.replace(/^http/, "ws")
  : K8sApiPrefix.replace(/^http/, "ws");

export const getAxiosClient = () => {
  const token = store.getState().get("auth").get("token");

  const instance = token
    ? axios.create({
        timeout: 10000,
        withCredentials: true,
        headers: {
          "X-CSRF-Token": store.getState().get("auth").get("csrf"),
          Authorization: `Bearer ${store.getState().get("auth").get("token")}`,
        },
      })
    : axios;

  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // console.log("error", error.response.status);
      return Promise.reject(error);
    },
  );

  return instance;
};

export const getClusterInfo = async (): Promise<ClusterInfo> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/cluster");
  return Immutable.fromJS(res.data);
};

export const getLoginStatus = async (): Promise<LoginStatus> => {
  const res = await getAxiosClient().get<LoginStatusContent>(K8sApiPrefix + "/login/status");
  return Immutable.Map(res.data);
};

export const validateToken = async (token: string): Promise<boolean> => {
  const res = await axios.post(K8sApiPrefix + "/login/token", { token });
  return res.status === 200;
};

export const getNodes = async (): Promise<NodesListResponse> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/nodes");
  return Immutable.fromJS(res.data);
};

export const getPersistentVolumes = async (): Promise<PersistentVolumes> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/volumes");
  return Immutable.fromJS(res.data);
};

export const deletePersistentVolume = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/volumes/${name}`);
};

export const getStorageClasses = async (): Promise<StorageClasses> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/storageclasses");
  return Immutable.fromJS(res.data);
};

// registry

export const getRegistries = async (): Promise<Immutable.List<RegistryType>> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/registries");
  return Immutable.fromJS(res.data);
};

export const getRegistry = async (name: string): Promise<RegistryType> => {
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/registries/${name}`);
  return Immutable.fromJS(res.data);
};

export const createRegistry = async (registry: RegistryType): Promise<RegistryType> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1alpha1/registries`, registry);

  return Immutable.fromJS(res.data);
};

export const updateRegistry = async (registry: RegistryType): Promise<RegistryType> => {
  const res = await getAxiosClient().put(K8sApiPrefix + `/v1alpha1/registries/${registry.get("name")}`, registry);
  return Immutable.fromJS(res.data);
};

export const deleteRegistry = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/registries/${name}`);
};

// applications

export const getKappApplicationList = async (): Promise<Immutable.List<ApplicationDetails>> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/applications");
  return Immutable.fromJS(res.data);
};

export const getKappApplication = async (name: string): Promise<ApplicationDetails> => {
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/applications/${name}`);
  return Immutable.fromJS(res.data);
};

export const createKappApplication = async (application: Application): Promise<ApplicationDetails> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1alpha1/applications`, application);

  return Immutable.fromJS(res.data);
};

export const updateKappApplication = async (application: Application): Promise<ApplicationDetails> => {
  const res = await getAxiosClient().put(
    K8sApiPrefix + `/v1alpha1/applications/${application.get("name")}`,
    application,
  );
  return Immutable.fromJS(res.data);
};

export const deleteKappApplication = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/applications/${name}`);
};

export const getKappApplicationComponentList = async (
  applicationName: string,
): Promise<Immutable.List<ApplicationComponentDetails>> => {
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/applications/${applicationName}/components`);
  return Immutable.fromJS(res.data);
};

export const getKappApplicationComponent = async (
  applicationName: string,
  name: string,
): Promise<ApplicationComponentDetails> => {
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/applications/${applicationName}/components/${name}`);
  return Immutable.fromJS(res.data);
};

export const createKappApplicationComponent = async (
  applicationName: string,
  component: ApplicationComponent,
): Promise<ApplicationComponentDetails> => {
  const res = await getAxiosClient().post(
    K8sApiPrefix + `/v1alpha1/applications/${applicationName}/components`,
    component,
  );

  return Immutable.fromJS(res.data);
};

export const updateKappApplicationComponent = async (
  applicationName: string,
  component: ApplicationComponent,
): Promise<ApplicationComponentDetails> => {
  const res = await getAxiosClient().put(
    K8sApiPrefix + `/v1alpha1/applications/${applicationName}/components/${component.get("name")}`,

    component,
  );
  return Immutable.fromJS(res.data);
};

export const deleteKappApplicationComponent = async (applicationName: string, name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/applications/${applicationName}/components/${name}`);
};

// plugins

export const getKappApplicationPlugins = async (): Promise<ApplicationPlugin[]> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/applicationplugins");
  return res.data;
};

export const getKappComponentPlugins = async (): Promise<ComponentPlugin[]> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/componentplugins");
  return res.data;
};

// routes

export const getHttpRoutes = async (namespace: string): Promise<Immutable.List<HttpRoute>> => {
  const res = await getAxiosClient().get(
    K8sApiPrefix + (!!namespace ? `/v1alpha1/httproutes/${namespace}` : `/v1alpha1/httproutes`),
  );
  return Immutable.fromJS(res.data);
};

export const updateHttpRoute = async (namespace: string, name: string, httpRoute: HttpRoute): Promise<HttpRoute> => {
  const res = await getAxiosClient().put(K8sApiPrefix + `/v1alpha1/httproutes/${namespace}/${name}`, httpRoute);
  return Immutable.fromJS(res.data);
};

export const createHttpRoute = async (namespace: string, httpRoute: HttpRoute): Promise<HttpRoute> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1alpha1/httproutes/${namespace}`, httpRoute);
  return Immutable.fromJS(res.data);
};

export const deleteHttpRoute = async (namespace: string, name: string): Promise<boolean> => {
  const res = await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/httproutes/${namespace}/${name}`);
  return res.status === 200;
};

export const deletePod = async (namespace: string, name: string) => {
  return await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/pods/${namespace}/${name}`);
};

// RoleBindings

export const loadRolebindings = async () => {
  const res = await getAxiosClient().get<{ roleBindings: any }>(K8sApiPrefix + "/v1alpha1/rolebindings");
  return Immutable.fromJS(res.data.roleBindings) as Immutable.List<RoleBinding>;
};

export const createRoleBindings = async (roleBindingRequestBody: RoleBindingsRequestBody) => {
  await getAxiosClient().post(K8sApiPrefix + "/v1alpha1/rolebindings", roleBindingRequestBody.toJS());
};

export const deleteRoleBindings = async (namespace: string, bindingName: string) => {
  await getAxiosClient().delete(K8sApiPrefix + "/v1alpha1/rolebindings/" + namespace + "/" + bindingName);
};

export const getServiceAccountSecret = async (name: string) => {
  const res = await getAxiosClient().get<{ token: string; "ca.crt": string }>(
    K8sApiPrefix + "/v1alpha1/serviceaccounts/" + name,
  );
  return res.data;
};

// certificate

export const getCertificateList = async (): Promise<CertificateList> => {
  if (process.env.NODE_ENV === "test") {
    return Immutable.fromJS(certificateListData.data);
  }
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/httpscerts");
  return Immutable.fromJS(res.data);
};

export const getCertificateIssuerList = async (): Promise<CertificateIssuerList> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/httpscertissuers");
  return Immutable.fromJS(res.data);
};

export const createCertificate = async (certificate: CertificateFormType, isEdit?: boolean): Promise<Certificate> => {
  let res;
  if (isEdit) {
    res = await getAxiosClient().put(K8sApiPrefix + `/v1alpha1/httpscerts/${certificate.get("name")}`, certificate);
  } else if (certificate.get("isSelfManaged")) {
    res = await getAxiosClient().post(K8sApiPrefix + `/v1alpha1/httpscerts/upload`, certificate);
  } else {
    res = await getAxiosClient().post(K8sApiPrefix + `/v1alpha1/httpscerts`, certificate);
  }

  return Immutable.fromJS(res.data);
};

export const createCertificateIssuer = async (
  certificateIssuer: CertificateIssuerFormType,
  isEdit?: boolean,
): Promise<CertificateIssuer> => {
  let res;
  if (isEdit) {
    res = await getAxiosClient().put(
      K8sApiPrefix + `/v1alpha1/httpscertissuers/${certificateIssuer.get("name")}`,
      certificateIssuer,
    );
  } else {
    res = await getAxiosClient().post(K8sApiPrefix + `/v1alpha1/httpscertissuers`, certificateIssuer);
  }
  return Immutable.fromJS(res.data);
};

export const deleteCertificate = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/httpscerts/${name}`);
};

// services

export const loadServices = async (name: string): Promise<Immutable.List<Service>> => {
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/services`);
  return Immutable.fromJS(res.data);
};
