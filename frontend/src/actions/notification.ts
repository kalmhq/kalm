import { VariantType } from "notistack";
import { SomethingWrong, ThunkResult } from "types";
import { SET_NOTIFICATION_MESSAGE } from "types/common";

const setNotificationMessageAction = (message: string, variant: VariantType): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({
      type: SET_NOTIFICATION_MESSAGE,
      payload: { message, variant },
    });
  };
};

export const setSuccessNotificationAction = (message: string) => setNotificationMessageAction(message, "success");

export const setErrorNotificationAction = (message: string = SomethingWrong) =>
  setNotificationMessageAction(message, "error");
