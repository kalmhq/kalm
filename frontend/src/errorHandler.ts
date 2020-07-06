import createThunkErrorHandlerMiddleware from "redux-thunk-error-handler";
import { StatusFailure } from "types";
import { setErrorNotificationAction } from "actions/notification";
import { store } from "store";

const ErrorHandler = (e: any) => {
  if (e.response && e.response.data.status === StatusFailure) {
    store.dispatch(setErrorNotificationAction(e.response.data.message));
  } else {
    store.dispatch(setErrorNotificationAction(e.message));
    console.log(e);
  }
};

export const errorHandlerMiddleware = createThunkErrorHandlerMiddleware({ onError: ErrorHandler });
