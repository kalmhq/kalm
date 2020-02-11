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
