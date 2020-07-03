import { getWebsocketInstance } from "actions/websocket";
import { mockStore } from "api/mockApi";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import {
  ResourceActionType,
  RESOURCE_TYPE_APPLICATION,
  RESOURCE_TYPE_COMPONENT,
  RESOURCE_TYPE_NODE,
  WATCHED_RESOURCE_CHANGE,
  RESOURCE_TYPE_HTTP_ROUTE,
  RESOURCE_TYPE_HTTPS_CERT,
  RESOURCE_TYPE_REGISTRY,
  RESOURCE_TYPE_VOLUME,
} from "types/resources";
import { loadApplicationsAction } from "actions/application";
import { loadRoutes } from "actions/routes";
import { loadNodesAction } from "actions/node";
import { loadCertificates, loadCertificateIssuers } from "actions/certificate";
import { loadClusterInfoAction } from "actions/cluster";
import { loadPersistentVolumesAction, loadStorageClassesAction } from "actions/persistentVolume";
import { loadRegistriesAction } from "actions/registries";
import { loadRoleBindingsAction } from "actions/user";
import { loadServicesAction } from "actions/service";

export interface WatchResMessage {
  namespace: string;
  kind: string;
  action: ResourceActionType;
  data: any;
}

const mapStateToProps = (state: RootState) => {
  return {
    token: state.get("auth").get("token"),
  };
};

interface Props extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

class WithDataRaw extends React.PureComponent<Props> {
  public componentDidMount() {
    this.loadData();
    this.connectWebsocket();
  }

  private loadData() {
    const { dispatch } = this.props;

    dispatch(loadRoutes("")); // all namespaces
    dispatch(loadApplicationsAction());
    dispatch(loadNodesAction());
    dispatch(loadCertificates());
    dispatch(loadCertificateIssuers());
    dispatch(loadClusterInfoAction());
    dispatch(loadPersistentVolumesAction());
    dispatch(loadRegistriesAction());
    dispatch(loadRoleBindingsAction());
    dispatch(loadServicesAction("")); // for routes destinations
    dispatch(loadStorageClassesAction());

    // dispatch(loadComponentPluginsAction());
  }

  private connectWebsocket() {
    const { dispatch, token } = this.props;
    let rws: any;
    if (process.env.REACT_APP_USE_MOCK_API === "true" || process.env.NODE_ENV === "test") {
      rws = mockStore;
    } else {
      rws = getWebsocketInstance();
      rws.addEventListener("open", () => {
        const message = {
          method: "StartWatching",
          token,
        };
        rws.send(JSON.stringify(message));
      });
    }

    rws.onmessage = async (event: any) => {
      const data: WatchResMessage = JSON.parse(event.data);

      switch (data.kind) {
        case RESOURCE_TYPE_APPLICATION: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_APPLICATION,
            payload: {
              action: data.action,
              data: Immutable.fromJS(data.data),
            },
          });
          break;
        }
        case RESOURCE_TYPE_COMPONENT: {
          dispatch({
            type: WATCHED_RESOURCE_CHANGE,
            kind: RESOURCE_TYPE_COMPONENT,
            payload: {
              namespace: data.namespace,
              action: data.action,
              data: Immutable.fromJS(data.data),
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
              data: Immutable.fromJS(data.data),
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
              data: Immutable.fromJS(data.data),
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
              data: Immutable.fromJS(data.data),
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
              data: Immutable.fromJS(data.data),
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
              data: Immutable.fromJS(data.data),
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

export const WithData = connect(mapStateToProps)(WithDataRaw);
