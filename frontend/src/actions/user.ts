import {
  getKappClusterRoles,
  getKappClusterRoleBindings,
  getKappServiceAccounts,
  getKappSecrets,
  createKappClusterRoleBinding,
  createKappServiceAccount,
  deleteKappClusterRoleBinding
} from "./kubernetesApi";
import Immutable from "immutable";
import { ThunkResult, StatusFailure } from "../types";
import { LOAD_USERS_PENDING, UserInterface, allClusterRoleNames, LOAD_USERS_FULFILLED, User } from "../types/user";
import { convertToCRDClusterRoleBinding } from "../convertors/ClusterRoleBinding";
import { convertToCRDServiceAccount } from "../convertors/ServiceAccount";
import { setErrorNotificationAction } from "./notification";

export const createClusterRoleBinding = (user: User, clusterRoleName: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    await createKappClusterRoleBinding(
      convertToCRDClusterRoleBinding(user.get("serviceAccountName")!, clusterRoleName, user.get("type"))
    );

    dispatch(loadUsersAction());
  };
};

export const deleteClusterRoleBinding = (user: User, clusterRoleName: string): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const name = user.get("clusterRoleBindingNames").get(clusterRoleName);
    if (name) {
      await deleteKappClusterRoleBinding(name);
    }

    dispatch(loadUsersAction());
  };
};

export const deleteUserAction = (user: User): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const deleteKappClusterRoleBindings = user
      .get("clusterRoleBindingNames")
      .map((clusterRoleBindingName, clusterRoleName) => {
        if (user.get("clusterRoleNames").get(clusterRoleName)) {
          return deleteKappClusterRoleBinding(clusterRoleBindingName);
        }
        return null;
      });
    await Promise.all(deleteKappClusterRoleBindings);

    dispatch(loadUsersAction());
  };
};

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
        return null;
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
        return null;
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
    ]).catch(e => {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return [[], [], [], []];
    });

    clusterRoles.forEach(() => {});
    // console.log("clusterRoles", clusterRoles);

    const serviceAccountSecretNameMap: { [key: string]: string } = {};
    serviceAccounts.forEach(serviceAccount => {
      if (serviceAccount.metadata && serviceAccount.metadata.name && serviceAccount.secrets![0].name) {
        serviceAccountSecretNameMap[serviceAccount.metadata.name] = serviceAccount.secrets![0].name;
      }
    });

    const secretNameTokenMap: { [key: string]: string } = {};
    secrets.forEach(secret => {
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

            usersMap[clusterRoleBinding.subjects![0].name].clusterRoleBindingNames = usersMap[
              clusterRoleBinding.subjects![0].name
            ].clusterRoleBindingNames.set(clusterRoleBinding.roleRef.name, clusterRoleBinding.metadata?.name as string);
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
              clusterRoleNames: Immutable.fromJS({}).set(clusterRoleBinding.roleRef.name, true),
              clusterRoleBindingNames: Immutable.fromJS({}).set(
                clusterRoleBinding.roleRef.name,
                clusterRoleBinding.metadata?.name
              )
            };
          }
        } else {
          // oidc
          if (usersMap[clusterRoleBinding.subjects![0].name]) {
            usersMap[clusterRoleBinding.subjects![0].name].clusterRoleNames = usersMap[
              clusterRoleBinding.subjects![0].name
            ].clusterRoleNames.set(clusterRoleBinding.roleRef.name, true);

            usersMap[clusterRoleBinding.subjects![0].name].clusterRoleBindingNames = usersMap[
              clusterRoleBinding.subjects![0].name
            ].clusterRoleBindingNames.set(clusterRoleBinding.roleRef.name, clusterRoleBinding.metadata?.name as string);
          } else {
            usersMap[clusterRoleBinding.subjects![0].name] = {
              name: clusterRoleBinding.subjects![0].name,
              type: "oidc",
              clusterRoleNames: Immutable.fromJS({}).set(clusterRoleBinding.roleRef.name, true),
              clusterRoleBindingNames: Immutable.fromJS({}).set(
                clusterRoleBinding.roleRef.name,
                clusterRoleBinding.metadata?.name
              )
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
