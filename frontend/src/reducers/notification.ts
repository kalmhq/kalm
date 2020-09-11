import { Actions } from "types";
import { VariantType } from "notistack";
import { SET_NOTIFICATION_MESSAGE } from "types/common";
import produce from "immer";

export type State = {
  message: string;
  variant: VariantType;
};

const initialState: State = {} as State;

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case SET_NOTIFICATION_MESSAGE: {
      state = action.payload;
      return;
    }
  }

  return state;
}, initialState);

export default reducer;
