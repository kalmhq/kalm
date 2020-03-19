import axios from "axios";
import { ComponentTemplate, ConfigFile } from ".";
import { convertFromCRDComponentTemplate } from "../convertors/ComponentTemplate";
import { V1alpha1ComponentTemplate } from "../kappModel/v1alpha1ComponentTemplate";
import {
  V1NodeList,
  V1PersistentVolumeList,
  V1ClusterRole,
  V1ClusterRoleBinding,
  V1ServiceAccount,
  V1Secret
} from "../model/models";
import { ItemList } from "../kappModel/List";
import { V1alpha1Dependency, V1alpha1File } from "../kappModel";
import { convertFromCRDDependency } from "../convertors/Dependency";
import { convertFromCRDFile } from "../convertors/File";
import { store } from "../store";
import { ApplicationList, Application } from "../types/application";
import Immutable from "immutable";

export const K8sApiPerfix = process.env.REACT_APP_K8S_API_PERFIX;

const getAxiosClient = () => {
  const token = store
    .getState()
    .get("auth")
    .get("token");

  if (token) {
    return axios.create({
      timeout: 3000,
      headers: {
        Authorization: `Bearer ${store
          .getState()
          .get("auth")
          .get("token")}`
      }
    });
  } else {
    return axios;
  }
};

export const getLoginStatus = async () => {
  const res = await getAxiosClient().get(K8sApiPerfix + "/login/status");
  return res.data.authorized as boolean;
};

export const login = async (token: string) => {
  const res = await axios.post(K8sApiPerfix + "/login", { token });
  return res.data.authorized as boolean;
};

export const getNodes = async () => {
  const res = await getAxiosClient().get<V1NodeList>(K8sApiPerfix + "/v1/nodes");
  return res.data.items;
};

export const getPersistentVolumes = async () => {
  const res = await getAxiosClient().get<V1PersistentVolumeList>(K8sApiPerfix + "/v1/persistentvolumes");
  return res.data.items;
};

export const getKappComponentTemplates = async () => {
  const res = await getAxiosClient().get<ItemList<V1alpha1ComponentTemplate>>(K8sApiPerfix + "/v1/componenttemplates");

  return res.data.items.map(convertFromCRDComponentTemplate);
};

export const updateKappComonentTemplate = async (component: V1alpha1ComponentTemplate): Promise<ComponentTemplate> => {
  const res = await getAxiosClient().put(
    K8sApiPerfix + `/v1/componenttemplates/${component.metadata!.name}`,
    component
  );

  return convertFromCRDComponentTemplate(res.data);
};

export const createKappComonentTemplate = async (component: V1alpha1ComponentTemplate): Promise<ComponentTemplate> => {
  const res = await getAxiosClient().post(K8sApiPerfix + `/v1/componenttemplates`, component);

  return convertFromCRDComponentTemplate(res.data);
};

export const deleteKappComonentTemplate = async (component: V1alpha1ComponentTemplate): Promise<void> => {
  await getAxiosClient().delete(K8sApiPerfix + `/v1/componenttemplates/${component.metadata!.name}`);

  // return convertFromCRDComponentTemplate(res.data);
};

export const getKappApplicationList = async (): Promise<ApplicationList> => {
  const res = await getAxiosClient().get(K8sApiPerfix + "/v1alpha1/applications");

  return Immutable.fromJS(res.data.applications);
};

export const getKappApplication = async (namespace: string, name: string): Promise<Application> => {
  const res = await getAxiosClient().get(K8sApiPerfix + `/v1alpha1/applications/${namespace}/${name}`);

  return Immutable.fromJS(res.data.application);
};

export const createKappApplication = async (application: Application): Promise<Application> => {
  const res = await getAxiosClient().post(K8sApiPerfix + `/v1alpha1/applications/${application.get("namespace")}`, {
    application
  });

  return Immutable.fromJS(res.data.application);
};

export const updateKappApplication = async (application: Application): Promise<Application> => {
  const res = await getAxiosClient().put(
    K8sApiPerfix + `/v1alpha1/applications/${application.get("namespace")}/${application.get("name")}`,
    { application }
  );

  return Immutable.fromJS(res.data.application);
};

export const deleteKappApplication = async (application: Application): Promise<void> => {
  await getAxiosClient().delete(
    K8sApiPerfix + `/v1alpha1/applications/${application.get("namespace")}/${application.get("name")}`
  );
};

export const getDependencies = async () => {
  const res = await getAxiosClient().get<ItemList<V1alpha1Dependency>>(K8sApiPerfix + "/v1/dependencies");
  return res.data.items.map(convertFromCRDDependency);
};

export const getKappFiles = async () => {
  const res = await getAxiosClient().get<ItemList<V1alpha1File>>(K8sApiPerfix + "/v1/files");

  return res.data.items.map(convertFromCRDFile);
};

export const createKappFile = async (file: V1alpha1File): Promise<ConfigFile> => {
  const res = await getAxiosClient().post(K8sApiPerfix + `/v1/files`, file);

  return convertFromCRDFile(res.data);
};

export const updateKappFile = async (file: V1alpha1File): Promise<ConfigFile> => {
  const res = await getAxiosClient().put(K8sApiPerfix + `/v1/files/${file.metadata!.name}`, file);

  return convertFromCRDFile(res.data);
};

export const deleteKappFile = async (file: V1alpha1File): Promise<void> => {
  await getAxiosClient().delete(K8sApiPerfix + `/v1/files/${file.metadata!.name}`);

  // return convertFromCRDFile(res.data);
};

export const getKappClusterRoles = async () => {
  const res = await getAxiosClient().get<ItemList<V1ClusterRole>>(K8sApiPerfix + "/v1/clusterroles");

  return res.data.items as V1ClusterRole[];
};

export const createKappClusterRole = async (clusterRole: V1ClusterRole): Promise<V1ClusterRole> => {
  const res = await getAxiosClient().post(K8sApiPerfix + `/v1/clusterroles`, clusterRole);

  return res.data;
};

export const getKappClusterRoleBindings = async () => {
  const res = await getAxiosClient().get<ItemList<V1ClusterRoleBinding>>(K8sApiPerfix + "/v1/clusterrolebindings");

  return res.data.items as V1ClusterRoleBinding[];
};

export const createKappClusterRoleBinding = async (
  clusterRoleBinding: V1ClusterRoleBinding
): Promise<V1ClusterRoleBinding> => {
  const res = await getAxiosClient().post(K8sApiPerfix + `/v1/clusterrolebindings`, clusterRoleBinding);

  return res.data;
};

export const getKappServiceAccounts = async () => {
  const res = await getAxiosClient().get<ItemList<V1ServiceAccount>>(K8sApiPerfix + "/v1/serviceaccounts");

  return res.data.items as V1ServiceAccount[];
};

export const createKappServiceAccount = async (serviceAccount: V1ServiceAccount): Promise<V1ServiceAccount> => {
  const res = await getAxiosClient().post(K8sApiPerfix + `/v1/serviceaccounts`, serviceAccount);

  return res.data;
};

export const getKappSecrets = async () => {
  const res = await getAxiosClient().get<ItemList<V1Secret>>(K8sApiPerfix + "/v1/secrets");

  return res.data.items as V1Secret[];
};

export const createKappSecret = async (secret: V1Secret): Promise<V1Secret> => {
  const res = await getAxiosClient().post(K8sApiPerfix + `/v1/secrets`, secret);

  return res.data;
};
