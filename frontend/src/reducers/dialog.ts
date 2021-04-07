import produce from "immer";
import { Actions } from "types";
import {
  CLEAR_CONTROLLED_DIALOG_DATA,
  CLOSE_CONTROLLED_DIALOG,
  ControlledDialogParams,
  DESTROY_CONTROLLED_DIALOG,
  INIT_CONTROLLED_DIALOG,
  LOGOUT,
  OPEN_CONTROLLED_DIALOG,
} from "types/common";

type State = { [key: string]: ControlledDialogParams<any> };

const initialState: State = {};

const emptyControlledDialogParams = () => ({
  open: false,
  data: {},
});

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case INIT_CONTROLLED_DIALOG: {
      state[action.payload.dialogID] = emptyControlledDialogParams();
      return;
    }
    case DESTROY_CONTROLLED_DIALOG: {
      delete state[action.payload.dialogID];
      return;
    }
    case OPEN_CONTROLLED_DIALOG: {
      state[action.payload.dialogID] = {
        open: true,
        data: action.payload.data,
      };
      return;
    }
    case CLOSE_CONTROLLED_DIALOG: {
      if (state[action.payload.dialogID]) {
        state[action.payload.dialogID].open = false;
      }
      return;
    }
    case CLEAR_CONTROLLED_DIALOG_DATA: {
      if (state[action.payload.dialogID]) {
        state[action.payload.dialogID].data = {};
      }
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
