import axios from "axios";
import {
  apiV1Nodes,
  apiV1PersistentVolumns,
  apiV1Alpha1ComponentTemplateList
} from "./kubernetesApiResponseSamples";
import { V1NodeList, V1PersistentVolumeList } from "../model/models";
import { V1Alpha1ComponentTemplateList } from "../kappModel/v1alpha1ComponentTemplateList";
import { convertFromCRDComponentTemplate } from "../convertors/ComponentTemplate";
import { V1Alpha1ComponentTemplate } from "../kappModel/v1alpha1ComponentTemplate";
import { ComponentTemplate } from ".";

export const K8sApiPerfix =
  process.env.REACT_APP_K8S_API_PERFIX || "http://localhost:3001";

const USE_CACHED_VALUE = true;

export const getNodes = async () => {
  if (USE_CACHED_VALUE) {
    return apiV1Nodes.items;
  } else {
    const res = await axios.get<V1NodeList>(K8sApiPerfix + "/api/v1/nodes");
    return res.data.items;
  }
};

export const getPersistentVolumes = async () => {
  if (USE_CACHED_VALUE) {
    return apiV1PersistentVolumns.items;
  } else {
    const res = await axios.get<V1PersistentVolumeList>(
      K8sApiPerfix + "/api/v1/persistentvolumes"
    );
    return res.data.items;
  }
};

export const getKappComponentTemplates = async () => {
  const res = await axios.get<V1Alpha1ComponentTemplateList>(
    K8sApiPerfix + "/apis/core.kapp.dev/v1alpha1/componenttemplates"
  );
  console.log(res.data.items[0]);
  return res.data.items.map(convertFromCRDComponentTemplate);
};

export const updateKappComonentTemplate = async (
  component: V1Alpha1ComponentTemplate
): Promise<ComponentTemplate> => {
  const res = await axios.put(
    K8sApiPerfix +
      `/apis/core.kapp.dev/v1alpha1/componenttemplates/${
        component.metadata!.name
      }`,
    component
  );

  return convertFromCRDComponentTemplate(res.data);
};

export const createKappComonentTemplate = async (
  component: V1Alpha1ComponentTemplate
): Promise<ComponentTemplate> => {
  const res = await axios.post(
    K8sApiPerfix + `/apis/core.kapp.dev/v1alpha1/componenttemplates`,
    component
  );

  return convertFromCRDComponentTemplate(res.data);
};

export const deleteKappComonentTemplate = async (
  component: V1Alpha1ComponentTemplate
): Promise<void> => {
  const res = await axios.delete(
    K8sApiPerfix +
      `/apis/core.kapp.dev/v1alpha1/componenttemplates/${
        component.metadata!.name
      }`
  );

  console.log(res.data);
  // return convertFromCRDComponentTemplate(res.data);
};
