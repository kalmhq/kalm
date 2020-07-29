import createThunkErrorHandlerMiddleware from "redux-thunk-error-handler";
import { StatusFailure } from "types";
import { setErrorNotificationAction } from "actions/notification";
import { store } from "store";
import { throttle } from "utils";

const ErrorHandler = (e: any) => {
  if (e.response && e.response.data.status === StatusFailure) {
    throttle(
      e.response.data.message,
      () => store.dispatch(setErrorNotificationAction(e.response.data.message)),
      10000,
    )();
  } else {
    throttle(e.message, () => store.dispatch(setErrorNotificationAction(e.message)), 10000)();
    console.log(e);
  }
};

export const errorHandlerMiddleware = createThunkErrorHandlerMiddleware({ onError: ErrorHandler });
