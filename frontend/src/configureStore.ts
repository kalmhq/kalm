import { errorHandlerMiddleware } from "errorHandler";
import { applyMiddleware, createStore } from "redux";
import { createLogger } from "redux-logger";
import thunkMiddleware from "redux-thunk";
import createRootReducer from "./reducers";

const configureStore = () => {
  const middlewares: any = [errorHandlerMiddleware, thunkMiddleware];

  if (process.env.REACT_APP_DEBUG === "true") {
    const logger = createLogger({
      diff: true,
      collapsed: true,
      stateTransformer: (state) => state,
    });

    middlewares.push(logger);
  }

  return createStore(createRootReducer(), undefined, applyMiddleware(...middlewares));
};

const store = configureStore();

export default store;
