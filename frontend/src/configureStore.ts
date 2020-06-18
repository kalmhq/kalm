import { createStore, applyMiddleware, compose } from "redux";
import thunkMiddleware from "redux-thunk";
import { History, LocationState } from "history";
import { routerMiddleware } from "connected-react-router/immutable";
import { createLogger } from "redux-logger";
import createRootReducer from "./reducers";
import { errorHandlerMiddleware } from "./errorHandler";

const configureStore = (history: History<LocationState>) => {
  const middlewares: any = [routerMiddleware(history), errorHandlerMiddleware, thunkMiddleware];

  if (process.env.REACT_APP_DEBUG) {
    const logger = createLogger({
      diff: true,
      collapsed: true,
      stateTransformer: state => state.toJS(),
    });

    middlewares.push(logger);
  }

  return createStore(createRootReducer(history), undefined, applyMiddleware(...middlewares));
};

export default configureStore;
