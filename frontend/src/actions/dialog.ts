import { Actions } from "../types";
import {
  CLEAR_CONTROLLED_DIALOG_DATA,
  CLOSE_CONTROLLED_DIALOG,
  DESTROY_CONTROLLED_DIALOG,
  INIT_CONTROLLED_DIALOG,
  OPEN_CONTROLLED_DIALOG,
} from "../types/common";

export const destroyDialogAction = (dialogID: string): Actions => {
  return {
    type: DESTROY_CONTROLLED_DIALOG,
    payload: {
      dialogID,
    },
  };
};

export const initDialogAction = (dialogID: string): Actions => {
  return {
    type: INIT_CONTROLLED_DIALOG,
    payload: {
      dialogID,
    },
  };
};

export const openDialogAction = (dialogID: string, data?: any): Actions => {
  return {
    type: OPEN_CONTROLLED_DIALOG,
    payload: {
      dialogID,
      data,
    },
  };
};

export const closeDialogAction = (dialogID: string): Actions => {
  return {
    type: CLOSE_CONTROLLED_DIALOG,
    payload: {
      dialogID,
    },
  };
};

export const clearDialogAction = (dialogID: string): Actions => {
  return {
    type: CLEAR_CONTROLLED_DIALOG_DATA,
    payload: {
      dialogID,
    },
  };
};
