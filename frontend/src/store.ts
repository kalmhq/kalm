import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import applications from "reducers/application";
import auth from "reducers/auth";
import certificates from "reducers/certificate";
import cluster from "reducers/cluster";
import components from "reducers/component";
import debounce from "reducers/debounce";
import deployAccessTokens from "reducers/deployAccessToken";
import dialogs from "reducers/dialog";
import domains from "reducers/domains";
import namespaces from "reducers/namespaces";
import nodes from "reducers/node";
import notification from "reducers/notification";
import persistentVolumes from "reducers/persistentVolume";
import registries from "reducers/registry";
import roles from "reducers/roleBinding";
import routes from "reducers/route";
import services from "reducers/service";
import settings from "reducers/settings";
import sso from "reducers/sso";
import { makeReducerForKind } from "reducers/util";
import { createLogger } from "redux-logger";
import { Deployment, K8sNode, Namespace } from "types/k8s";

export const store = configureStore({
  reducer: {
    namespacesV2: makeReducerForKind<Namespace>("Namespace", {}),
    deploymentsV2: makeReducerForKind<Deployment>("Deployment", {}),
    nodesV2: makeReducerForKind<K8sNode>("Node", {}),
    secretsV2: makeReducerForKind<K8sNode>("Secret", {}),
    namespaces,
    nodes,
    registries,
    auth,
    dialogs,
    persistentVolumes,
    applications,
    components,
    notification,
    settings,
    sso,
    roles,
    routes,
    cluster,
    services,
    certificates,
    debounce,
    deployAccessTokens,
    domains,
  },
  middleware: (getDefaultMiddleware) => {
    if (process.env.REACT_APP_DEBUG === "true") {
      const logger = createLogger({
        diff: true,
        collapsed: true,
        stateTransformer: (state) => state,
      });

      return getDefaultMiddleware().concat(logger);
    }

    return getDefaultMiddleware();
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
