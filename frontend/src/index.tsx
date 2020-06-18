import React from "react";
import ReactDOM from "react-dom";
import "driver.js/dist/driver.min.css";
import "./index.css";
import "./antd.css";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { ConnectedRouter } from "connected-react-router/immutable";
import configureStore from "./configureStore";
import { createBrowserHistory } from "history";
import { ThemeProvider, CssBaseline } from "@material-ui/core";
import { ScrollToTop } from "./widgets/ScrollToTop";
import { setStore } from "./store";
import { KappRoutes } from "./routes";
import { Snackbar } from "./widgets/Notification";
import { theme } from "theme";

export const history = createBrowserHistory();

const store = configureStore(history);

setStore(store);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
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
