import { ObjectSerializer, V1ServiceAccount } from "../model/models";

export const convertToCRDServiceAccount = (serviceAccountName: string): V1ServiceAccount => {
  return ObjectSerializer.deserialize(
    {
      apiVersion: "v1",
      kind: "ServiceAccount",
      metadata: {
        namespace: "default",
        name: serviceAccountName
      }
    },
    "V1ServiceAccount"
  );
};
