import React from "react";
import Immutable from "immutable";
import configureStore from "configureStore";
import { Store, createStore, combineReducers } from "redux";
import { createBrowserHistory } from "history";
import { RootState } from "reducers";
import { Provider } from "react-redux";
import { reduxForm, reducer as formReducer } from "redux-form";
import { ConnectedRouter } from "connected-react-router/immutable";

import { LOAD_LOGIN_STATUS_FULFILLED, LOGOUT } from "types/common";

export const history = createBrowserHistory();
export const store: Store<RootState, any> = configureStore(history) as any;

export const resetStore = () => {
  store.dispatch({ type: LOGOUT });
  store.dispatch({
    type: LOAD_LOGIN_STATUS_FULFILLED,
    payload: {
      loginStatus: Immutable.fromJS({
        authorized: true,
        isAdmin: true,
        entity: "system:serviceaccount:default:kalm-sample-user",
        csrf: "",
      }),
    },
  });
};

// @ts-ignore
export const withProvider = (story) => (
  <Provider store={store}>
    <ConnectedRouter history={history}>{story()}</ConnectedRouter>
  </Provider>
);

// @ts-ignore
export const withReduxForm = (story) => {
  const reducers = { form: formReducer };
  const reducer = combineReducers(reducers);
  const store = createStore(reducer);
  const Test = reduxForm({ form: "withReduxForm" })(story);
  return (
    <Provider store={store}>
      <Test />
    </Provider>
  );
};

export default withReduxForm;
