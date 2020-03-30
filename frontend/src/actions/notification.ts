import { VariantType } from "notistack";
import { SET_NOTIFICATION_MESSAGE } from "../types/common";
import { ThunkResult, SomethingWrong } from "../types";

export const setNotificationMessageAction = (message: string, variant: VariantType): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: SET_NOTIFICATION_MESSAGE,
      payload: { message, variant }
    });
  };
};

export const setSuccessNotificationAction = (message: string) => setNotificationMessageAction(message, "success");

export const setErrorNotificationAction = (message: string = SomethingWrong) =>
  setNotificationMessageAction(message, "error");

export const setInfoNotificationAction = (message: string) => setNotificationMessageAction(message, "info");

export const setWarnNotificationAction = (message: string) => setNotificationMessageAction(message, "warning");
