import Immutable from "immutable";
import {
  CLEAR_CONTROLLED_DIALOG_DATA,
  CLOSE_CONTROLLED_DIALOG,
  ControlledDialogParams,
  DESTROY_CONTROLLED_DIALOG,
  INIT_CONTROLLED_DIALOG,
  LOGOUT,
  OPEN_CONTROLLED_DIALOG,
} from "../types/common";
import { Actions } from "../types";

export type State = Immutable.Map<string, ControlledDialogParams<any>>;

const initialState: State = Immutable.Map({});

const emptyControlledDialogParams = () =>
  Immutable.Map({
    open: false,
    data: {},
  });

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOGOUT: {
      return initialState;
    }
    case INIT_CONTROLLED_DIALOG: {
      state = state.set(action.payload.dialogID, emptyControlledDialogParams());
      break;
    }
    case DESTROY_CONTROLLED_DIALOG: {
      state = state.delete(action.payload.dialogID);
      break;
    }
    case OPEN_CONTROLLED_DIALOG: {
      state = state.set(
        action.payload.dialogID,
        Immutable.Map({
          open: true,
          data: action.payload.data,
        }),
      );
      break;
    }
    case CLOSE_CONTROLLED_DIALOG: {
      state = state.setIn([action.payload.dialogID, "open"], false);
      break;
    }
    case CLEAR_CONTROLLED_DIALOG_DATA: {
      if (state.get(action.payload.dialogID)) {
        state = state.setIn([action.payload.dialogID, "data"], {});
      }
      break;
    }
  }

  return state;
};

export default reducer;
