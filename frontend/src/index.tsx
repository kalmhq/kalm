import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./antd.css";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { ConnectedRouter } from "connected-react-router/immutable";
import configureStore from "./configureStore";
import { createBrowserHistory } from "history";
import { ThemeProvider, createMuiTheme, CssBaseline } from "@material-ui/core";
import { SnackbarProvider } from "notistack";
import { ScrollToTop } from "./widgets/ScrollToTop";
import { setStore } from "./store";
import { KappRoutes } from "./routes";
import blue from "@material-ui/core/colors/blue";
import { NotificationComponent } from "./widgets/Notification";

export const history = createBrowserHistory();

const store = configureStore(history);

setStore(store);

const theme = createMuiTheme({
  palette: {
    primary: blue
  },
  typography: {
    fontSize: 12
  }
});

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <CssBaseline />
      <ScrollToTop>
        <ThemeProvider theme={theme}>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              horizontal: "right",
              vertical: "bottom"
            }}>
            <NotificationComponent />
            {KappRoutes}
          </SnackbarProvider>
        </ThemeProvider>
      </ScrollToTop>
    </ConnectedRouter>
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
