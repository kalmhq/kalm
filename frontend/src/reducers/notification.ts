import produce from "immer";
import { VariantType } from "notistack";
import { Actions } from "types";
import { SET_NOTIFICATION_MESSAGE } from "types/common";

type State = {
  message: string;
  variant: VariantType;
};

const initialState: State = {} as State;

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case SET_NOTIFICATION_MESSAGE: {
      return action.payload;
    }
  }

  return;
}, initialState);

export default reducer;
