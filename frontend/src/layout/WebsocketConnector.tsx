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
} from "types/resources";

export interface ResMessage {
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
