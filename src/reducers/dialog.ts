import Immutable from "immutable";
import {
  Actions,
  ControlledDialogParams,
  DESTROY_CONTROLLED_DIALOG,
  INIT_CONTROLLED_DIALOG,
  OPEN_CONTROLLED_DIALOG,
  CLOSE_CONTROLLED_DIALOG
} from "../actions";

export type State = Immutable.Map<string, ControlledDialogParams<any>>;

const initialState: State = Immutable.Map({});

const emptyControlledDialogParams = () =>
  Immutable.Map({
    open: false,
    data: {}
  });

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
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
          data: action.payload.data
        })
      );
      break;
    }
    case CLOSE_CONTROLLED_DIALOG: {
      state = state.setIn([action.payload.dialogID, "open"], false);
      break;
    }
  }

  return state;
};

export default reducer;
