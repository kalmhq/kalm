import { ImmutableMap } from "../typings";
import { Actions, SET_SETTINGS } from "../actions";
import Immutable from "immutable";

export interface SettingObject {
  isDisplayingHelpers: boolean;
}

export type State = ImmutableMap<SettingObject>;

const initialState: State = Immutable.Map({
  isDisplayingHelpers:
    window.localStorage.getItem("isDisplayingHelpers") === "true"
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case SET_SETTINGS: {
      const newParitalSettings = Immutable.Map(action.payload);
      state = state.merge(newParitalSettings);
      break;
    }
  }

  window.localStorage.setItem(
    "isDisplayingHelpers",
    state.get("isDisplayingHelpers").toString()
  );

  return state;
};

export default reducer;
