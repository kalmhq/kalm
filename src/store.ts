import { createStore, applyMiddleware } from "redux";

// Logger with default options
// import logger from "redux-logger";

import reducer from "./reducers";

// applyMiddleware(logger)
const middlewares = undefined;

const store = createStore(reducer, undefined, middlewares);
export default store;
