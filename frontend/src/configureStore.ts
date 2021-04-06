import { routerMiddleware } from "connected-react-router";
import { errorHandlerMiddleware } from "errorHandler";
import { History, LocationState } from "history";
import { applyMiddleware, createStore } from "redux";
import { createLogger } from "redux-logger";
import thunkMiddleware from "redux-thunk";
import createRootReducer from "./reducers";

const configureStore = (history: History<LocationState>) => {
  const middlewares: any = [routerMiddleware(history), errorHandlerMiddleware, thunkMiddleware];

  if (process.env.REACT_APP_DEBUG === "true") {
    const logger = createLogger({
      diff: true,
      collapsed: true,
      stateTransformer: (state) => state,
    });

    middlewares.push(logger);
  }

  return createStore(createRootReducer(history), undefined, applyMiddleware(...middlewares));
};

export default configureStore;
