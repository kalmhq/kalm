import { setErrorNotificationAction } from "actions/notification";
import { store } from "configureStore";
import createThunkErrorHandlerMiddleware from "redux-thunk-error-handler";
import { StatusFailure } from "types";

const ErrorHandler = (e: any) => {
  if (e.response && e.response.data.status === StatusFailure) {
    store.dispatch(setErrorNotificationAction(e.response.data.message));
  }
  throw e;
};

export const errorHandlerMiddleware = createThunkErrorHandlerMiddleware({ onError: ErrorHandler });
