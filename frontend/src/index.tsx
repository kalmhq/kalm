import { ConnectedRouter } from "connected-react-router";
import "driver.js/dist/driver.min.css";
import { createBrowserHistory } from "history";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { HistoryUserConfirmation } from "widgets/History";
import configureStore from "./configureStore";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import { setStore } from "store";
import { App } from "app/index";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

if (process.env.REACT_APP_ENABLE_SENTRY && process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    // https://docs.sentry.io/platforms/javascript/guides/react/integrations/default/
    defaultIntegrations: false,
    integrations: [
      new Sentry.Integrations.GlobalHandlers({ onerror: true, onunhandledrejection: true }),
      new Integrations.BrowserTracing(),
    ],
    release: process.env.REACT_APP_NAME + "@" + process.env.REACT_APP_VERSION,
  });
}

export const history = createBrowserHistory({
  getUserConfirmation: HistoryUserConfirmation,
});

const store = configureStore(history);

setStore(store);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App />
    </ConnectedRouter>
  </Provider>,
  document.getElementById("root"),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
