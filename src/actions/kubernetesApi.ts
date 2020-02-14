import axios from "axios";

export const currentKubernetesAPIAddress = "http://localhost:3001";

export const getNodes = async () => {
  const res = await axios.get<kubernetes.NodeList>(
    currentKubernetesAPIAddress + "/api/v1/nodes"
  );

  return res.data.items;
};
