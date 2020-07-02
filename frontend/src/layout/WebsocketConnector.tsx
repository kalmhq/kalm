import { getWebsocketInstance } from "actions/websocket";
import { api } from "api";
import { mockStore } from "api/mockApi";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import {
  ApplicationComponentDetails,
  ApplicationDetails,
  CREATE_APPLICATION,
  CREATE_COMPONENT,
  DELETE_APPLICATION,
  DELETE_COMPONENT,
  UPDATE_COMPONENT,
} from "types/application";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_NODE,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";

export interface ResMessage {
  namespace: string;
  component: string;
  kind: string;
  action: typeof RESOURCE_ACTION_UPDATE | typeof RESOURCE_ACTION_ADD | typeof RESOURCE_ACTION_DELETE;
  data: any;
}

const mapStateToProps = (state: RootState) => {
  return {
    token: state.get("auth").get("token"),
  };
};

interface Props extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

class WebsocketConnectorRaw extends React.PureComponent<Props> {
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
      const data: ResMessage = JSON.parse(event.data);

      switch (data.kind) {
        case "Component": {
          const componentDetails: ApplicationComponentDetails = Immutable.fromJS(data.data);
          if (data.action === "Add") {
            dispatch({
              type: CREATE_COMPONENT,
              payload: { applicationName: data.namespace, component: componentDetails },
            });
          } else if (data.action === "Update") {
            dispatch({
              type: UPDATE_COMPONENT,
              payload: { applicationName: data.namespace, component: componentDetails },
            });
          } else if (data.action === "Delete") {
            dispatch({
              type: DELETE_COMPONENT,
              payload: { applicationName: data.namespace, componentName: componentDetails.get("name") },
            });
          }
          break;
        }
        case "Application": {
          let application: ApplicationDetails = Immutable.fromJS(data.data);
          if (data.action === "Add") {
            if (application.get("status") === "Active") {
              const components = await api.getKappApplicationComponentList(application.get("name"));
              application = application.set("components", components);
              dispatch({
                type: CREATE_APPLICATION,
                payload: { application },
              });
            }
          } else if (data.action === "Update") {
            if (application.get("status") === "Terminating") {
              dispatch({
                type: DELETE_APPLICATION,
                payload: { applicationName: application.get("name") },
              });
            } else {
              const components = await api.getKappApplicationComponentList(application.get("name"));
              application = application.set("components", components);
              dispatch({
                type: CREATE_APPLICATION,
                payload: { application },
              });
            }
          } else if (data.action === "Delete") {
            dispatch({
              type: DELETE_APPLICATION,
              payload: { applicationName: application.get("name") },
            });
          }
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
      }
    };
  }

  public componentDidMount() {
    this.connectWebsocket();
  }

  public render() {
    return null;
  }
}

export const WebsocketConnector = connect(mapStateToProps)(WebsocketConnectorRaw);
