import axios from "axios";
import { ComponentTemplate, Application } from ".";
import { convertFromCRDComponentTemplate } from "../convertors/ComponentTemplate";
import { V1alpha1ComponentTemplate } from "../kappModel/v1alpha1ComponentTemplate";
import { V1NodeList, V1PersistentVolumeList } from "../model/models";
import { ItemList } from "../kappModel/List";
import { V1alpha1Application, V1alpha1Dependency } from "../kappModel";
import { convertFromCRDApplication } from "../convertors/Application";
import { convertFromCRDDependency } from "../convertors/Dependency";

export const K8sApiPerfix = process.env.REACT_APP_K8S_API_PERFIX || "http://localhost:3001";

export const getNodes = async () => {
  const res = await axios.get<V1NodeList>(K8sApiPerfix + "/api/v1/nodes");
  return res.data.items;
};

export const getPersistentVolumes = async () => {
  const res = await axios.get<V1PersistentVolumeList>(K8sApiPerfix + "/api/v1/persistentvolumes");
  return res.data.items;
};

export const getKappComponentTemplates = async () => {
  const res = await axios.get<ItemList<V1alpha1ComponentTemplate>>(
    K8sApiPerfix + "/apis/core.kapp.dev/v1alpha1/componenttemplates"
  );

  return res.data.items.map(convertFromCRDComponentTemplate);
};

export const updateKappComonentTemplate = async (component: V1alpha1ComponentTemplate): Promise<ComponentTemplate> => {
  const res = await axios.put(
    K8sApiPerfix + `/apis/core.kapp.dev/v1alpha1/componenttemplates/${component.metadata!.name}`,
    component
  );

  return convertFromCRDComponentTemplate(res.data);
};

export const createKappComonentTemplate = async (component: V1alpha1ComponentTemplate): Promise<ComponentTemplate> => {
  const res = await axios.post(K8sApiPerfix + `/apis/core.kapp.dev/v1alpha1/componenttemplates`, component);

  return convertFromCRDComponentTemplate(res.data);
};

export const deleteKappComonentTemplate = async (component: V1alpha1ComponentTemplate): Promise<void> => {
  await axios.delete(K8sApiPerfix + `/apis/core.kapp.dev/v1alpha1/componenttemplates/${component.metadata!.name}`);

  // return convertFromCRDComponentTemplate(res.data);
};

export const getKappApplications = async () => {
  const res = await axios.get<ItemList<V1alpha1Application>>(
    K8sApiPerfix + "/apis/core.kapp.dev/v1alpha1/applications"
  );

  return res.data.items.map(convertFromCRDApplication);
};

export const updateKappApplication = async (application: V1alpha1Application): Promise<Application> => {
  const res = await axios.put(
    K8sApiPerfix +
      `/apis/core.kapp.dev/v1alpha1/namespaces/${application.metadata!.namespace}/applications/${
        application.metadata!.name
      }`,
    application
  );

  return convertFromCRDApplication(res.data);
};

export const getDependencies = async () => {
  const res = await axios.get<ItemList<V1alpha1Dependency>>(K8sApiPerfix + "/apis/core.kapp.dev/v1alpha1/dependencies");
  return res.data.items.map(convertFromCRDDependency);
};
