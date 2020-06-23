import { CssBaseline, ThemeProvider } from "@material-ui/core";
import { ConnectedRouter } from "connected-react-router/immutable";
import "driver.js/dist/driver.min.css";
import { createBrowserHistory } from "history";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { theme } from "theme";
import { HistoryUserConfirmation } from "widgets/History";
import configureStore from "./configureStore";
import "./index.css";
import { KappRoutes } from "./routes";
import * as serviceWorker from "./serviceWorker";
import { setStore } from "./store";
import { Snackbar } from "./widgets/Notification";
import { ScrollToTop } from "./widgets/ScrollToTop";

export const history = createBrowserHistory({
  getUserConfirmation: HistoryUserConfirmation,
});

const store = configureStore(history);

setStore(store);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <div id="history-prompt-anchor" />
      <CssBaseline />
      <ScrollToTop>
        <ThemeProvider theme={theme}>
          <Snackbar />
          {KappRoutes}
        </ThemeProvider>
      </ScrollToTop>
    </ConnectedRouter>
  </Provider>,
  document.getElementById("root"),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
