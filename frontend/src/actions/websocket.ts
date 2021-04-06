import ReconnectingWebSocket from "reconnecting-websocket";

const wsPrefix = (process.env.REACT_APP_K8S_API_PREFIX || window.location.origin || "").replace(/^http/, "ws") + "/ws";

let rws: ReconnectingWebSocket;

export const getWebsocketInstance = (): ReconnectingWebSocket => {
  if (rws) {
    return rws;
  }

  return new ReconnectingWebSocket(wsPrefix);
};
