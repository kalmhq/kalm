import configureStore from "configureStore";
import { ConnectedRouter } from "connected-react-router";
import { createBrowserHistory } from "history";
import React from "react";
import { Provider } from "react-redux";
import { RootState } from "reducers";
import { Store } from "redux";
import { LOAD_LOGIN_STATUS_FULFILLED, LOGOUT } from "types/common";

export const history = createBrowserHistory();
export const store: Store<RootState, any> = configureStore(history) as any;

export const resetStore = () => {
  store.dispatch({ type: LOGOUT });
  store.dispatch({
    type: LOAD_LOGIN_STATUS_FULFILLED,
    payload: {
      loginStatus: {
        authorized: true,
        email: "system:serviceaccount:default:kalm-sample-user",
      },
    },
  });
};

// @ts-ignore
export const withProvider = (story) => (
  <Provider store={store}>
    <ConnectedRouter history={history}>{story()}</ConnectedRouter>
  </Provider>
);
