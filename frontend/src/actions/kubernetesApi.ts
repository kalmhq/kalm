import axios from "axios";
import {
  convertFromCRDComponentTemplateSpec,
  convertToCRDComponentTemplateSpec
} from "../convertors/ComponentTemplate";
import {
  V1NodeList,
  V1PersistentVolumeList,
  V1ClusterRole,
  V1ClusterRoleBinding,
  V1ServiceAccount,
  V1Secret
} from "../model/models";
import { ItemList } from "../kappModel/List";
import { V1alpha1Dependency, V1alpha1File, V1alpha1ComponentTemplateSpec } from "../kappModel";
import { convertFromCRDDependency } from "../convertors/Dependency";
import { convertFromCRDFile } from "../convertors/File";
import { store } from "../store";
import { ApplicationList, Application } from "../types/application";
import Immutable from "immutable";
import { ComponentTemplate } from "../types/componentTemplate";
import { ConfigFile } from "../types/config";
import { ImmutableMap } from "../typings";

export const K8sApiPrefix = process.env.REACT_APP_K8S_API_PERFIX;
export const k8sWsPrefix = !K8sApiPrefix
  ? window.location.origin.replace(/^http/, "ws")
  : K8sApiPrefix.replace(/^http/, "ws");

const getAxiosClient = () => {
  const token = store
    .getState()
    .get("auth")
    .get("token");

  const instance = token
    ? axios.create({
        timeout: 3000,
        headers: {
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
      console.log("error", error.response.status);
      return Promise.reject(error);
    }
  );

  return instance;
};

export const getLoginStatus = async () => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/login/status");
  return res.data.authorized as boolean;
};

export const login = async (token: string) => {
  const res = await axios.post(K8sApiPrefix + "/login", { token });
  return res.data.authorized as boolean;
};

export const getNodes = async () => {
  const res = await getAxiosClient().get<V1NodeList>(K8sApiPrefix + "/v1/nodes");
  return res.data.items;
};

export const getPersistentVolumes = async () => {
  const res = await getAxiosClient().get<V1PersistentVolumeList>(K8sApiPrefix + "/v1/persistentvolumes");
  return res.data.items;
};

export const getKappComponentTemplates = async () => {
  const res = await getAxiosClient().get<V1alpha1ComponentTemplateSpec[]>(
    K8sApiPrefix + "/v1alpha1/componenttemplates"
  );
  return res.data.map(convertFromCRDComponentTemplateSpec);
};

export const createKappComonentTemplate = async (component: ComponentTemplate): Promise<ComponentTemplate> => {
  const res = await getAxiosClient().post(
    K8sApiPrefix + `/v1alpha1/componenttemplates`,
    convertToCRDComponentTemplateSpec(component)
  );

  return convertFromCRDComponentTemplateSpec(res.data);
};

export const updateKappComonentTemplate = async (component: ComponentTemplate): Promise<ComponentTemplate> => {
  const res = await getAxiosClient().put(
    K8sApiPrefix + `/v1alpha1/componenttemplates/${component.get("name")}`,
    convertToCRDComponentTemplateSpec(component)
  );

  return convertFromCRDComponentTemplateSpec(res.data);
};

export const deleteKappComonentTemplate = async (component: ComponentTemplate): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/componenttemplates/${component.get("name")}`);

  // return convertFromCRDComponentTemplate(res.data);
};

export const getKappApplicationList = async (): Promise<ApplicationList> => {
  const res = await getAxiosClient().get(K8sApiPrefix + "/v1alpha1/applications");

  return Immutable.fromJS(res.data.applications);
};

export const getKappApplication = async (
  namespace: string,
  name: string
): Promise<ImmutableMap<{ application: Application; podNames: Immutable.List<string> }>> => {
  const res = await getAxiosClient().get(K8sApiPrefix + `/v1alpha1/applications/${namespace}/${name}`);

  return Immutable.fromJS(res.data);
};

export const createKappApplication = async (application: Application): Promise<Application> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1alpha1/applications/${application.get("namespace")}`, {
    application
  });

  return Immutable.fromJS(res.data.application);
};

export const updateKappApplication = async (application: Application): Promise<Application> => {
  const res = await getAxiosClient().put(
    K8sApiPrefix + `/v1alpha1/applications/${application.get("namespace")}/${application.get("name")}`,
    { application }
  );

  return Immutable.fromJS(res.data.application);
};

export const deleteKappApplication = async (namespace: string, name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1alpha1/applications/${namespace}/${name}`);
};

export const getDependencies = async () => {
  const res = await getAxiosClient().get<ItemList<V1alpha1Dependency>>(K8sApiPrefix + "/v1/dependencies");
  return res.data.items.map(convertFromCRDDependency);
};

export const getKappFiles = async () => {
  const res = await getAxiosClient().get<ItemList<V1alpha1File>>(K8sApiPrefix + "/v1/files");

  return res.data.items.map(convertFromCRDFile);
};

export const createKappFile = async (file: V1alpha1File): Promise<ConfigFile> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1/files`, file);

  return convertFromCRDFile(res.data);
};

export const updateKappFile = async (file: V1alpha1File): Promise<ConfigFile> => {
  const res = await getAxiosClient().put(K8sApiPrefix + `/v1/files/${file.metadata!.name}`, file);

  return convertFromCRDFile(res.data);
};

export const deleteKappFile = async (file: V1alpha1File): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1/files/${file.metadata!.name}`);

  // return convertFromCRDFile(res.data);
};

export const getKappClusterRoles = async () => {
  const res = await getAxiosClient().get<ItemList<V1ClusterRole>>(K8sApiPrefix + "/v1/clusterroles");

  return res.data.items as V1ClusterRole[];
};

export const createKappClusterRole = async (clusterRole: V1ClusterRole): Promise<V1ClusterRole> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1/clusterroles`, clusterRole);

  return res.data;
};

export const deleteKappClusterRole = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1/clusterroles/${name}`);
};

export const getKappClusterRoleBindings = async () => {
  const res = await getAxiosClient().get<ItemList<V1ClusterRoleBinding>>(K8sApiPrefix + "/v1/clusterrolebindings");

  return res.data.items as V1ClusterRoleBinding[];
};

export const createKappClusterRoleBinding = async (
  clusterRoleBinding: V1ClusterRoleBinding
): Promise<V1ClusterRoleBinding> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1/clusterrolebindings`, clusterRoleBinding);

  return res.data;
};

export const deleteKappClusterRoleBinding = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1/clusterrolebindings/${name}`);
};

export const getKappServiceAccounts = async () => {
  const res = await getAxiosClient().get<ItemList<V1ServiceAccount>>(K8sApiPrefix + "/v1/serviceaccounts");

  return res.data.items as V1ServiceAccount[];
};

export const createKappServiceAccount = async (serviceAccount: V1ServiceAccount): Promise<V1ServiceAccount> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1/serviceaccounts`, serviceAccount);

  return res.data;
};

export const deleteKappServiceAccount = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1/serviceaccounts/${name}`);
};

export const getKappSecrets = async () => {
  const res = await getAxiosClient().get<ItemList<V1Secret>>(K8sApiPrefix + "/v1/secrets");

  return res.data.items as V1Secret[];
};

export const createKappSecret = async (secret: V1Secret): Promise<V1Secret> => {
  const res = await getAxiosClient().post(K8sApiPrefix + `/v1/secrets`, secret);

  return res.data;
};

export const getKappSecret = async (name: string) => {
  const res = await getAxiosClient().get<ItemList<V1Secret>>(K8sApiPrefix + `/v1/secrets/${name}`);

  return res.data as V1Secret;
};

export const deleteKappSecret = async (name: string): Promise<void> => {
  await getAxiosClient().delete(K8sApiPrefix + `/v1/secrets/${name}`);
};
