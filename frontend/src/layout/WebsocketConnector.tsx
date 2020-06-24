import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { getWebsocketInstance } from "../actions/websocket";
import {
  CREATE_COMPONENT,
  ApplicationComponentDetails,
  UPDATE_COMPONENT,
  DELETE_COMPONENT,
} from "../types/application";
import Immutable from "immutable";

export interface ResMessage {
  namespace: string;
  component: string;
  kind: string;
  action: "Add" | "Update" | "Delete";
  data: any;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class WebsocketConnectorRaw extends React.PureComponent<Props, State> {
  // constructor(props: Props) {
  //   super(props);
  //   this.state = {};
  // }

  private connectWebsocket() {
    const { dispatch } = this.props;

    const rws = getWebsocketInstance();

    rws.addEventListener("open", () => {
      const message = {
        method: "StartWatching",
        token:
          "eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImthcHAtc2FtcGxlLXVzZXItdG9rZW4teno0dGoiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoia2FwcC1zYW1wbGUtdXNlciIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6Ijc5ZDNkNDEwLTc1OGUtNGNkMS1hOGU5LWI2OGMxYWJkYzg2YyIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmthcHAtc2FtcGxlLXVzZXIifQ.aO2wsO4PcqtWBdT10Ythf0ExAqWMgqS_YsxTMF6DVzInXkJEtzVVXUiIfYwV21fPzaiAr4-R2FoTpAkuz4BTSZXTdiO89VrbebS6rNiVe73HVC7njA23PgEHWVdtOWezc6U3Hm9FhTqdVzujf2FhAG71zGUVdt-hGZu77v9KMctxcr1Y6xVaL2H79rR6V8z2xJxlCdPST1Q11uVvrjL2msts6mIrf61PNOaGwkd5qBtqTSTOFMrehL2JjZAeZxtZZKBZlZhJUPZIEU2DQNcwjVo_RPmdB1jyzBFRueE2LYiz8vpqCq8CgtDdcDHfGLIWdgS6CfjCmti5peBRTTXdHg",
      };
      rws.send(JSON.stringify(message));
    });

    rws.onmessage = async (event) => {
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
        case "Service": {
          break;
        }
        case "Pod": {
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

export const WebsocketConnector = withStyles(styles)(connect(mapStateToProps)(WebsocketConnectorRaw));
