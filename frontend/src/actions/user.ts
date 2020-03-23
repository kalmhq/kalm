import {
  getKappClusterRoles,
  getKappClusterRoleBindings,
  getKappServiceAccounts,
  getKappSecrets,
  createKappClusterRoleBinding,
  createKappServiceAccount
} from "./kubernetesApi";
import Immutable, { OrderedMap } from "immutable";
import { ThunkResult } from "../types";
import {
  LOAD_USERS_PENDING,
  UserInterface,
  clusterRoleNames,
  ClusterRoleName,
  LOAD_USERS_FULFILLED,
  User
} from "../types/user";
import { convertToCRDClusterRoleBinding } from "../convertors/ClusterRoleBinding";
import { convertToCRDServiceAccount } from "../convertors/ServiceAccount";

export const createUserAction = (user: User): ThunkResult<Promise<void>> => {
  return async dispatch => {
    if (user.get("type") === "oidc") {
      // oidc user
      const createKappClusterRoleBindings = user.get("clusterRoleNames").map(clusterRoleName => {
        createKappClusterRoleBinding(convertToCRDClusterRoleBinding(user.get("name"), clusterRoleName, "oidc"));
      });
      await Promise.all(createKappClusterRoleBindings);
    } else {
      // serviceAccount
      await createKappServiceAccount(convertToCRDServiceAccount(user.get("name")));
      const createKappClusterRoleBindings = user.get("clusterRoleNames").map(clusterRoleName => {
        createKappClusterRoleBinding(
          convertToCRDClusterRoleBinding(user.get("name"), clusterRoleName, "serviceAccount")
        );
      });
      await Promise.all(createKappClusterRoleBindings);
    }
  };
};

export const loadUsersAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_USERS_PENDING });
    // @ts-ignore TODO
    const [clusterRoles, clusterRoleBindings, serviceAccounts, secrets] = await Promise.all([
      getKappClusterRoles(),
      getKappClusterRoleBindings(),
      getKappServiceAccounts(),
      getKappSecrets()
    ]);

    const clusterRoleNamesMap: { [key: string]: boolean } = {};
    clusterRoleNames.forEach(name => {
      clusterRoleNamesMap[name] = true;
    });

    const usersMap: { [key: string]: UserInterface } = {};

    clusterRoleBindings.forEach(clusterRoleBinding => {
      if (clusterRoleNamesMap[clusterRoleBinding.roleRef.name]) {
        if (
          clusterRoleBinding.subjects![0].kind === "ServiceAccount" ||
          (clusterRoleBinding.subjects![0].kind === "User" &&
            clusterRoleBinding.subjects![0].name.startsWith("system:serviceaccount:"))
        ) {
          // serviceAccount
          if (usersMap[clusterRoleBinding.subjects![0].name]) {
            usersMap[clusterRoleBinding.subjects![0].name].clusterRoleNames.push(
              clusterRoleBinding.roleRef.name as ClusterRoleName
            );
          } else {
            usersMap[clusterRoleBinding.subjects![0].name] = {
              name: clusterRoleBinding.subjects![0].name,
              type: "serviceAccount",
              token: "",
              clusterRoleNames: [clusterRoleBinding.roleRef.name as ClusterRoleName]
            };
          }
        } else {
          // oidc
          if (usersMap[clusterRoleBinding.subjects![0].name]) {
            usersMap[clusterRoleBinding.subjects![0].name].clusterRoleNames.push(
              clusterRoleBinding.roleRef.name as ClusterRoleName
            );
          } else {
            usersMap[clusterRoleBinding.subjects![0].name] = {
              name: clusterRoleBinding.subjects![0].name,
              type: "oidc",
              clusterRoleNames: [clusterRoleBinding.roleRef.name as ClusterRoleName]
            };
          }
        }
      }
    });

    dispatch({
      type: LOAD_USERS_FULFILLED,
      payload: {
        users: Immutable.fromJS(usersMap)
      }
    });
  };
};
