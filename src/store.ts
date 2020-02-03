import { createStore, applyMiddleware, compose } from "redux";

// Logger with default options
// import logger from "redux-logger";

import reducer from "./reducers";

const composeEnhancers =
  (window["__REDUX_DEVTOOLS_EXTENSION_COMPOSE__"] as typeof compose) || compose;

const store = createStore(reducer, undefined, composeEnhancers());
export default store;
