import { ObjectSerializer, V1ClusterRoleBinding } from "../model/models";
import { UserType } from "../types/user";

export const convertToCRDClusterRoleBinding = (
  userName: string,
  clusterRoleName: string,
  userType: UserType
): V1ClusterRoleBinding => {
  let subject;
  if (userType === "oidc") {
    subject = {
      kind: "User",
      apiGroup: "rbac.authorization.k8s.io",
      name: userName
    };
  } else {
    // format1
    // {
    //   "kind": "User",
    //   "apiGroup": "rbac.authorization.k8s.io",
    //   "name": "system:serviceaccount:default:kapp-sample-user"
    // }
    // format2
    // {
    //   "kind": "ServiceAccount",
    //   "name": "kindnet",
    //   "namespace": "kube-system"
    // }
    subject = {
      kind: "User",
      apiGroup: "rbac.authorization.k8s.io",
      name: `system:serviceaccount:default:${userName}`
    };
  }

  return ObjectSerializer.deserialize(
    {
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "ClusterRoleBinding",
      metadata: {
        name: `kapp-${clusterRoleName}-${userName}`
      },
      roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: clusterRoleName
      },
      subjects: [subject]
    },
    "V1ClusterRoleBinding"
  );
};
