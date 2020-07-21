import { ImmutableMap } from "typings";
import { Actions } from "types";
import Immutable from "immutable";
import { SET_SETTINGS } from "types/common";

export interface SettingObject {
  isDisplayingHelpers: boolean;
  isSubmittingApplication: boolean;
  isOpenRootDrawer: boolean;
  isShowTopProgress: boolean;
  usingApplicationCard: boolean;
}

export type State = ImmutableMap<SettingObject>;

const initialState: State = Immutable.Map({
  isDisplayingHelpers: window.localStorage.getItem("isDisplayingHelpers") === "true",
  isOpenRootDrawer: window.localStorage.getItem("isOpenRootDrawer") === "true",
  usingApplicationCard: window.localStorage.getItem("usingApplicationCard") === "true",
  isShowTopProgress: false,
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case SET_SETTINGS: {
      const newParitalSettings = Immutable.Map(action.payload);
      state = state.merge(newParitalSettings);
      break;
    }
  }

  window.localStorage.setItem("isDisplayingHelpers", state.get("isDisplayingHelpers").toString());
  window.localStorage.setItem("isOpenRootDrawer", state.get("isOpenRootDrawer").toString());
  window.localStorage.setItem("usingApplicationCard", state.get("usingApplicationCard").toString());

  return state;
};

export default reducer;
