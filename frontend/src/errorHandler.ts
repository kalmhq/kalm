import { setErrorNotificationAction } from "actions/notification";
import { store } from "store";
import { StatusFailure } from "types";

const ErrorHandler = (e: any) => {
  if (e.response && e.response.data.status === StatusFailure) {
    store.dispatch(setErrorNotificationAction(e.response.data.message));
  }
  throw e;
};
