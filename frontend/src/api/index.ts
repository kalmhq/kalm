import RealApi from "api/api";
import { loadApiResources } from "api/resources";
import { K8sObject } from "types";

export const api = new RealApi();

export { watchResourceList } from "./streaming";

//  const createResource = async (object: K8sObject) => {
//   const url = await getObjectListRequestUrl(object);
//   const res = await axios.post(url, object);
//   console.log(res);
// };

//  const updateResource = async (object: K8sObject) => {
//   const url = await getObjectRequestUrl(object);
//   const res = await axios.put(url, object);
//   console.log(res);
// };

//  const deleteResource = async (object: K8sObject) => {
//   const url = await getObjectRequestUrl(object);
//   const res = await axios.delete(url);
//   console.log(res);
// };

// export const getObjectRequestUrl = async (object: K8sObject) => {
//   const url = await getObjectListRequestUrl(object);
//   return url + "/" + object.metadata.name;
// };

export const getObjectListRequestUrl = async (object: K8sObject) => {
  const url = await getPathForKind(object);
  return `${process.env.REACT_APP_K8S_API_V2_PREFIX}/proxy/${url}`;
};

const getPathForKind = async (object: K8sObject) => {
  const apiResourceLists = await loadApiResources();
  for (let list of apiResourceLists) {
    for (let resource of list.resources) {
      if (resource.kind === object.kind) {
        return (
          (!list.apiVersion ? "api/" : "apis/") +
          list.groupVersion +
          (resource.namespaced && object.metadata.namespace ? "/namespaces/" + object.metadata.namespace + "/" : "/") +
          resource.name
        );
      }
    }
  }

  throw new Error("No ApiGroupVersion for kind: " + object.kind);
};
