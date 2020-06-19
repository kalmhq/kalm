import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { getWebsocketInstance } from "../actions/websocket";

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
    console.log("---------1-------");

    const rws = getWebsocketInstance();

    rws.addEventListener("open", () => {
      console.log("---------2-------");
      rws.send("hello!");
    });

    rws.onmessage = async e => console.log("---3----", e.data);
  }

  public componentDidMount() {
    this.connectWebsocket();
  }

  public render() {
    return null;
  }
}

export const WebsocketConnector = withStyles(styles)(connect(mapStateToProps)(WebsocketConnectorRaw));
