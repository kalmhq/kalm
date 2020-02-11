import { createStore, applyMiddleware, compose } from "redux";
import thunkMiddleware from "redux-thunk";
import { History, LocationState } from "history";
import { routerMiddleware } from "connected-react-router/immutable";
// Logger with default options
// import logger from "redux-logger";

import createRootReducer from "./reducers";

const composeEnhancers =
  (window["__REDUX_DEVTOOLS_EXTENSION_COMPOSE__"] as typeof compose) || compose;

const configureStore = (history: History<LocationState>) =>
  createStore(
    createRootReducer(history),
    undefined,
    composeEnhancers(
      applyMiddleware(routerMiddleware(history), thunkMiddleware)
    )
  );

export default configureStore;
