import axios from "axios";
import {
  apiV1Nodes,
  apiV1PersistentVolumns
} from "./kubernetesApiResponseSamples";

export const currentKubernetesAPIAddress = "http://localhost:3001";

const USE_CACHED_VALUE = true;

export const getNodes = async () => {
  if (USE_CACHED_VALUE) {
    return apiV1Nodes.items;
  } else {
    const res = await axios.get<kubernetes.Node.List>(
      currentKubernetesAPIAddress + "/api/v1/nodes"
    );
    return res.data.items;
  }
};

export const getPersistentVolumes = async () => {
  if (USE_CACHED_VALUE) {
    return apiV1PersistentVolumns.items;
  } else {
    const res = await axios.get<kubernetes.PersistentVolumn.List>(
      currentKubernetesAPIAddress + "/api/v1/persistentvolumes"
    );
    return res.data.items;
  }
};
