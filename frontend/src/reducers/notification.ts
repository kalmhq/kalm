import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { VariantType } from "notistack";
import { SET_NOTIFICATION_MESSAGE } from "types/common";

export type State = ImmutableMap<{
  message: string;
  variant: VariantType;
}>;

const initialState: State = Immutable.Map({});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case SET_NOTIFICATION_MESSAGE: {
      return Immutable.Map(action.payload);
    }
  }

  return state;
};

export default reducer;
