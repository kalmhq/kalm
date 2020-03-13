import Immutable from "immutable";
import { SET_NOTIFICATION_MESSAGE } from "../actions";
import { Actions } from "../actions";
import { ImmutableMap } from "../typings";
import { VariantType } from "notistack";

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
