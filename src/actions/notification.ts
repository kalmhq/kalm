import { SET_NOTIFICATION_MESSAGE_ACTION, ThunkResult } from ".";
import { VariantType } from "notistack";

export const setNotificationMessageAction = (
  message: string,
  variant: VariantType
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: SET_NOTIFICATION_MESSAGE_ACTION,
      payload: { message, variant }
    });
  };
};

export const setSuccessNotificationAction = (message: string) =>
  setNotificationMessageAction(message, "success");

export const setErrorNotificationAction = (message: string) =>
  setNotificationMessageAction(message, "error");

export const setInfoNotificationAction = (message: string) =>
  setNotificationMessageAction(message, "info");

export const setWarnNotificationAction = (message: string) =>
  setNotificationMessageAction(message, "warning");
