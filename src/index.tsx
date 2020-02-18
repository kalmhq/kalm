import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./antd.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { ConnectedRouter } from "connected-react-router/immutable";
import configureStore from "./configureStore";
import { createBrowserHistory } from "history";
import { ThemeProvider, createMuiTheme } from "@material-ui/core";
import { SnackbarProvider } from "notistack";
import { ScrollToTop } from "./widgets/ScrollToTop";
import { setStore } from "./store";

export const history = createBrowserHistory();

const store = configureStore(history);

setStore(store);

const theme = createMuiTheme({
  typography: {
    fontSize: 12
  }
});

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <ScrollToTop>
        <ThemeProvider theme={theme}>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              horizontal: "right",
              vertical: "bottom"
            }}
          >
            <App />
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
