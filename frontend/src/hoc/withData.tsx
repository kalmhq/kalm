import { getWebsocketInstance } from "actions/websocket";
import { mockStore } from "@apiType/index";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import {
  RESOURCE_TYPE_ACME_SERVER,
  RESOURCE_TYPE_APPLICATION,
  RESOURCE_TYPE_COMPONENT,
  RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN,
  RESOURCE_TYPE_HTTP_ROUTE,
  RESOURCE_TYPE_HTTPS_CERT,
  RESOURCE_TYPE_NODE,
  RESOURCE_TYPE_PROTECTED_ENDPOINT,
  RESOURCE_TYPE_REGISTRY,
  RESOURCE_TYPE_ROLE_BINDING,
  RESOURCE_TYPE_SERVICE,
  RESOURCE_TYPE_SSO,
  RESOURCE_TYPE_VOLUME,
  ResourceActionType,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { loadApplicationsAction } from "actions/application";
import { loadRoutesAction } from "actions/routes";
import { loadNodesAction } from "actions/node";
import {
  loadCertificateAcmeServerAction,
  loadCertificateIssuersAction,
  loadCertificatesAction,
} from "actions/certificate";
import { loadClusterInfoAction } from "actions/cluster";
import { loadPersistentVolumesAction, loadStorageClassesAction } from "actions/persistentVolume";
import { loadRegistriesAction } from "actions/registries";
import { loadServicesAction } from "actions/service";
import { loadProtectedEndpointAction, loadSSOConfigAction } from "actions/sso";
import { setErrorNotificationAction } from "actions/notification";
import { loadDeployAccessTokensAction } from "actions/deployAccessToken";
import { AccessTokenToDeployAccessToken } from "types/deployAccessToken";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { generateKalmImpersonnation } from "api/realApi";
import throttle from "lodash/throttle";

export interface WatchResMessage {
  namespace: string;
  kind: string;
  action: ResourceActionType;
  data: any;
}

const mapStateToProps = (state: RootState) => {
  return {
    activeNamespaceName: state.namespaces.active,
  };
};

interface Props extends ReturnType<typeof mapStateToProps>, TDispatchProp, WithUserAuthProps {}

class WithDataRaw extends React.PureComponent<Props> {
  public componentDidMount() {
    this.loadData();

    this.connectWebsocket();
  }

  private loadData() {
    const { dispatch, canViewCluster, canEditNamespace, activeNamespaceName } = this.props;

    dispatch(loadRoutesAction()); // all namespaces
    dispatch(loadApplicationsAction());
    dispatch(loadDeployAccessTokensAction());
    dispatch(loadProtectedEndpointAction());

    if (canEditNamespace(activeNamespaceName) || canViewCluster()) {
      dispatch(loadRegistriesAction());
    }

    if (canViewCluster()) {
      dispatch(loadCertificatesAction());
      dispatch(loadCertificateIssuersAction());
      dispatch(loadCertificateAcmeServerAction());
      dispatch(loadSSOConfigAction());
      dispatch(loadNodesAction());
      dispatch(loadClusterInfoAction());
      dispatch(loadServicesAction("")); // for routes destinations
      dispatch(loadPersistentVolumesAction());
      dispatch(loadStorageClassesAction());
    }
  }

  private connectWebsocket() {
    const { dispatch, authToken, impersonation, impersonationType, canViewCluster } = this.props;
    let rws: any;
    if (process.env.REACT_APP_USE_MOCK_API === "true" || process.env.NODE_ENV === "test") {
      rws = mockStore;
    } else {
      rws = getWebsocketInstance();
      rws.addEventListener("open", () => {
        const message = {
          method: "StartWatching",
          token: authToken,
          impersonation: generateKalmImpersonnation(impersonation, impersonationType),
        };
        rws.send(JSON.stringify(message));
      });
    }

    const reloadResouces = () => {
      if (canViewCluster()) {
        dispatch(loadPersistentVolumesAction()); // is in use can't watch
        dispatch(loadServicesAction("")); // for routes destinations
      }
    };

    const throttledReloadResouces = throttle(reloadResouces, 10000, { leading: true, trailing: true });

    rws.onmessage = async (event: any) => {
      const data: WatchResMessage = JSON.parse(event.data);

      switch (data.kind) {
        case "error": {
          dispatch(setErrorNotificationAction(data.data));
          break;
        }
        case RESOURCE_TYPE_APPLICATION: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_APPLICATION,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_COMPONENT: {
          throttledReloadResouces();
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_COMPONENT,
            payload: {
              namespace: data.namespace,
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_HTTP_ROUTE: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_HTTP_ROUTE,
            payload: {
              namespace: data.namespace,
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_NODE: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_NODE,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_HTTPS_CERT: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_HTTPS_CERT,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_REGISTRY: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_REGISTRY,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_VOLUME: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_VOLUME,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_SSO: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_SSO,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_PROTECTED_ENDPOINT: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_PROTECTED_ENDPOINT,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_DEPLOY_ACCESS_TOKEN,
            payload: {
              action: data.action,
              data: AccessTokenToDeployAccessToken(data.data),
            },
          });
          break;
        }
        case RESOURCE_TYPE_SERVICE: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_SERVICE,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_ROLE_BINDING: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_ROLE_BINDING,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
        case RESOURCE_TYPE_ACME_SERVER: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_ACME_SERVER,
            payload: {
              action: data.action,
              data: data.data,
            },
          });
          break;
        }
      }
    };
  }

  public render() {
    return null;
  }
}

export const WithData = withUserAuth(connect(mapStateToProps)(WithDataRaw));
