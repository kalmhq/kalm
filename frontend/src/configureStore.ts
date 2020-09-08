import { routerMiddleware } from "connected-react-router/immutable";
import { History, LocationState } from "history";
import { applyMiddleware, createStore } from "redux";
import { createLogger } from "redux-logger";
import thunkMiddleware from "redux-thunk";
import { errorHandlerMiddleware } from "errorHandler";
import createRootReducer from "./reducers";
import { createCasbinEnforcerMiddleware } from "middlewares/casbin";

const configureStore = (history: History<LocationState>) => {
  const middlewares: any = [
    createCasbinEnforcerMiddleware(),
    routerMiddleware(history),
    errorHandlerMiddleware,
    thunkMiddleware,
  ];

  if (process.env.REACT_APP_DEBUG === "true") {
    const logger = createLogger({
      diff: true,
      collapsed: true,
      stateTransformer: (state) => state.toJS(),
    });

    middlewares.push(logger);
  }

  return createStore(createRootReducer(history), undefined, applyMiddleware(...middlewares));
};

export default configureStore;
