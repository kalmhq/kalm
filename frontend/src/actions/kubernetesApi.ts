import axios from "axios";
import Immutable from "immutable";
import { LoginStatus, LoginStatusContent } from "types/authorization";
import { KappDependency } from "types/dependency";
import { NodesListResponse } from "types/node";
import { RoleBinding, RoleBindingsRequestBody } from "types/user";
import { getCurrentNamespace } from "../selectors/namespace";
import { store } from "../store";
import {
  Application,
  ApplicationDetails,
  ApplicationDetailsList,
  ApplicationComponentDetailsList,
  ApplicationComponentDetails,
  ApplicationComponent,
  ApplicationPlugin,
  ComponentPlugin
} from "../types/application";
import { ComponentTemplate } from "../types/componentTemplate";
import { ConfigCreate, ConfigRes } from "../types/config";
import { RegistryType } from "types/registry";
import { CertificateList, Certificate, CertificateFormType } from "types/certificate";
import { HttpRoute } from "types/route";

export const K8sApiPrefix = process.env.REACT_APP_K8S_API_PERFIX;
export const k8sWsPrefix = !K8sApiPrefix
  ? window.location.origin.replace(/^http/, "ws")
  : K8sApiPrefix.replace(/^http/, "ws");

export const getAxiosClient = () => {
  const token = store
    .getState()
    .get("auth")
    .get("token");

  const instance = token
    ? axios.create({
        timeout: 10000,
        withCredentials: true,
        headers: {
          "X-CSRF-Token": store
            .getState()
            .get("auth")
            .get("csrf"),
          Authorization: `Bearer ${store
            .getState()
            .get("auth")
            .get("token")}`
        }
      })
    : axios;

  instance.interceptors.response.use(
    response => {
      return response;
    },
    error => {
      // console.log("error", error.response.status);
      return Promise.reject(error);
    }
  );

  return instance;
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

export const getPersistentVolumes = async (): Promise<any[]> => {
  // const res = await getAxiosClient().get<V1PersistentVolumeList>(K8sApiPrefix + "/v1/persistentvolumes");
  // return res.data.items;
  return [];
};

export const getKappComponentTemplates = async (): Promise<Array<ComponentTemplate>> => {
  //   const res = await getAxiosClient().get<V1alpha1ComponentTemplateSpec[]>(
  //     K8sApiPrefix + "/v1alpha1/componenttemplates"
  //   );
  //   return res.data.map(convertFromCRDComponentTemplateSpec);
  return [];
};

export const createKappComonentTemplate = async (component: ComponentTemplate): Promise<ComponentTemplate> => {
  //   const res = await getAxiosClient().post(
  //     K8sApiPrefix + `/v1alpha1/componenttemplates`,
  //     convertToCRDComponentTemplateSpec(component)
  //   );
  //   return convertFromCRDComponentTemplateSpec(res.data);
  return {} as ComponentTemplate;
};

export const updateKappComonentTemplate = async (component: ComponentTemplate): Promise<ComponentTemplate> => {
  //   const res = await getAxiosClient().put(
  //     K8sApiPrefix + `/v1alpha1/componenttemplates/${component.get("name")}`,
  //     convertToCRDComponentTemplateSpec(component)
  //   );
  //   return convertFromCRDComponentTemplateSpec(res.data);
  return {} as ComponentTemplate;
};

export const deleteKappComonentTemplate = async (component: ComponentTemplate): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/componenttemplates/${component.get("name")}`);

  // return convertFromCRDComponentTemplate(res.data);
};

// registry

export const getRegistries = async (): Promise<Immutable.List<RegistryType>> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/registries");
  return Immutable.fromJS(res.data);
};

// applications

export const getKappApplicationList = async (): Promise<ApplicationDetailsList> => {
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
    application
  );
  return Immutable.fromJS(res.data);
};

export const deleteKappApplication = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/applications/${name}`);
};

export const getKappApplicationComponentList = async (
  applicationName: string
): Promise<ApplicationComponentDetailsList> => {
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/applications/${applicationName}/components`);
  return Immutable.fromJS(res.data);
};

export const getKappApplicationComponent = async (
  applicationName: string,
  name: string
): Promise<ApplicationComponentDetails> => {
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/applications/${applicationName}/components/${name}`);
  return Immutable.fromJS(res.data);
};

export const createKappApplicationComponent = async (
  applicationName: string,
  component: ApplicationComponent
): Promise<ApplicationComponentDetails> => {
  const res = await getAxiosClient().post(
    K8sApiPrefix + `/v1alpha1/applications/${applicationName}/components`,
    component
  );

  return Immutable.fromJS(res.data);
};

export const updateKappApplicationComponent = async (
  applicationName: string,
  component: ApplicationComponent
): Promise<ApplicationComponentDetails> => {
  const res = await getAxiosClient().put(
    K8sApiPrefix + `/v1alpha1/applications/${applicationName}/components/${component.get("name")}`,

    component
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
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/httproutes/${namespace}`);
  return Immutable.fromJS(res.data);
};

// export const getHttpRoute = async (namespace: string, name: string): Promise<HttpRoute> => {
//   const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/httproutes/${namespace}/${name}`);
//   return Immutable.fromJS(res.data);
// };

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

// dependencies

export const getDependencies = async (): Promise<Array<KappDependency>> => {
  await getAxiosClient().get<Array<KappDependency>>(K8sApiPrefix + "/v1/dependencies");
  // return res.data.items.map(convertFromCRDDependency);
  return {} as Array<KappDependency>;
};

export const getKappFilesV1alpha1 = async (namespace?: string) => {
  namespace = namespace || getCurrentNamespace();
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/files/${namespace}`);

  return res.data as ConfigRes;
};

export const createKappFilesV1alpha1 = async (files: ConfigCreate[]) => {
  const namespace = getCurrentNamespace();
  await getAxiosClient().post(K8sApiPrefix + `/v1alpha1/files/${namespace}`, {
    files
  });
};

export const updateKappFileV1alpha1 = async (path: string, content: string) => {
  const namespace = getCurrentNamespace();
  await getAxiosClient().put(K8sApiPrefix + `/v1alpha1/files/${namespace}`, {
    path,
    content
  });
};

export const moveKappFileV1alpha1 = async (oldPath: string, newPath: string) => {
  const namespace = getCurrentNamespace();
  await getAxiosClient().put(K8sApiPrefix + `/v1alpha1/files/${namespace}/move`, {
    oldPath,
    newPath
  });
};

export const deleteKappFileV1alpha1 = async (path: string) => {
  const namespace = getCurrentNamespace();
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/files/${namespace}`, {
    // https://github.com/axios/axios/issues/897#issuecomment-343715381
    data: {
      path
    }
  });
};

export const deletePod = async (namespace: string, name: string) => {
  return await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/pods/${namespace}/${name}`);
};

// export const getNamespaces = async () => {
//   const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/namespaces");
//   return Immutable.fromJS(res.data) as Namespaces;
// };

// export const createNamespace = async (name: string) => {
//   await getAxiosClient().post<null>(K8sApiPrefix + "/v1alpha1/namespaces/" + name);
// };

// export const deleteNamespace = async (name: string) => {
//   await getAxiosClient().delete<null>(K8sApiPrefix + "/v1alpha1/namespaces/" + name);
// };

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
    K8sApiPrefix + "/v1alpha1/serviceaccounts/" + name
  );
  return res.data;
};

// certificate

export const getCertificateList = async (): Promise<CertificateList> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/httpscerts");
  return Immutable.fromJS(res.data);
};

export const createCertificate = async (certificate: CertificateFormType): Promise<ApplicationDetails> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1alpha1/httpscerts/upload`, certificate);

  return Immutable.fromJS(res.data);
};

export const deleteCertificate = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/httpscerts/${name}`);
};
