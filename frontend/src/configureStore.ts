import { configureStore } from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";
import createRootReducer from "./reducers";

export const store = configureStore({
  reducer: createRootReducer(),
  middleware: (getDefaultMiddleware) => {
    if (process.env.REACT_APP_DEBUG === "true") {
      const logger = createLogger({
        diff: true,
        collapsed: true,
        stateTransformer: (state) => state,
      });

      return getDefaultMiddleware().concat(logger);
    }

    return getDefaultMiddleware();
  },
  devTools: process.env.NODE_ENV !== "production",
});
