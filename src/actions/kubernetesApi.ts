import axios from "axios";
import {
  apiV1Nodes,
  apiV1PersistentVolumns
} from "./kubernetesApiResponseSamples";
import { V1NodeList, V1PersistentVolumeList } from "../model/models";

export const currentKubernetesAPIAddress = "http://localhost:3001";

const USE_CACHED_VALUE = true;

export const getNodes = async () => {
  if (USE_CACHED_VALUE) {
    return apiV1Nodes.items;
  } else {
    const res = await axios.get<V1NodeList>(
      currentKubernetesAPIAddress + "/api/v1/nodes"
    );
    return res.data.items;
  }
};

export const getPersistentVolumes = async () => {
  if (USE_CACHED_VALUE) {
    return apiV1PersistentVolumns.items;
  } else {
    const res = await axios.get<V1PersistentVolumeList>(
      currentKubernetesAPIAddress + "/api/v1/persistentvolumes"
    );
    return res.data.items;
  }
};

// export const getKappResources = async () => {
//   const res = await axios.get<k8s.Kapp.Application>
// }
