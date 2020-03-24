import {
  getKappClusterRoles,
  getKappClusterRoleBindings,
  getKappServiceAccounts,
  getKappSecrets,
  createKappClusterRoleBinding,
  createKappServiceAccount
} from "./kubernetesApi";
import Immutable from "immutable";
import { ThunkResult } from "../types";
import {
  LOAD_USERS_PENDING,
  UserInterface,
  allClusterRoleNames,
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
      const createKappClusterRoleBindings = user.get("clusterRoleNames").map((exist, clusterRoleName) => {
        if (exist) {
          return createKappClusterRoleBinding(
            convertToCRDClusterRoleBinding(user.get("name"), clusterRoleName, "oidc")
          );
        }
      });
      await Promise.all(createKappClusterRoleBindings);
    } else {
      // serviceAccount
      await createKappServiceAccount(convertToCRDServiceAccount(user.get("name")));
      const createKappClusterRoleBindings = user.get("clusterRoleNames").map((exist, clusterRoleName) => {
        if (exist) {
          return createKappClusterRoleBinding(
            convertToCRDClusterRoleBinding(user.get("name"), clusterRoleName, "serviceAccount")
          );
        }
      });
      await Promise.all(createKappClusterRoleBindings);
    }
    dispatch(loadUsersAction());
  };
};

export const loadUsersAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_USERS_PENDING });

    const [clusterRoles, clusterRoleBindings, serviceAccounts, secrets] = await Promise.all([
      getKappClusterRoles(),
      getKappClusterRoleBindings(),
      getKappServiceAccounts(),
      getKappSecrets()
    ]);

    clusterRoles.map(() => {});
    // console.log("clusterRoles", clusterRoles);

    const serviceAccountSecretNameMap: { [key: string]: string } = {};
    serviceAccounts.map(serviceAccount => {
      if (serviceAccount.metadata && serviceAccount.metadata.name && serviceAccount.secrets![0].name) {
        serviceAccountSecretNameMap[serviceAccount.metadata.name] = serviceAccount.secrets![0].name;
      }
    });

    const secretNameTokenMap: { [key: string]: string } = {};
    secrets.map(secret => {
      if (secret.metadata && secret.metadata.name && secret.data) {
        secretNameTokenMap[secret.metadata.name] = atob(secret.data.token); // decode base64
      }
    });

    const clusterRoleNamesMap: { [key: string]: boolean } = {};
    allClusterRoleNames.forEach(name => {
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
            usersMap[clusterRoleBinding.subjects![0].name].clusterRoleNames = usersMap[
              clusterRoleBinding.subjects![0].name
            ].clusterRoleNames.set(clusterRoleBinding.roleRef.name, true);
          } else {
            const nameSplits = clusterRoleBinding.subjects![0].name.split(":");
            const serviceAccountName = nameSplits[nameSplits.length - 1];
            const secretName = serviceAccountSecretNameMap[serviceAccountName];
            const token = secretNameTokenMap[secretName];

            usersMap[clusterRoleBinding.subjects![0].name] = {
              name: clusterRoleBinding.subjects![0].name,
              type: "serviceAccount",
              serviceAccountName,
              secretName,
              token,
              clusterRoleNames: Immutable.fromJS({}).set(clusterRoleBinding.roleRef.name, true)
            };
          }
        } else {
          // oidc
          if (usersMap[clusterRoleBinding.subjects![0].name]) {
            usersMap[clusterRoleBinding.subjects![0].name].clusterRoleNames = usersMap[
              clusterRoleBinding.subjects![0].name
            ].clusterRoleNames.set(clusterRoleBinding.roleRef.name, true);
          } else {
            usersMap[clusterRoleBinding.subjects![0].name] = {
              name: clusterRoleBinding.subjects![0].name,
              type: "oidc",
              clusterRoleNames: Immutable.fromJS({}).set(clusterRoleBinding.roleRef.name, true)
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
