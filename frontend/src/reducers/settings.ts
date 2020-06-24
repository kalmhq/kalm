import { ImmutableMap } from "typings";
import { Actions } from "types";
import Immutable from "immutable";
import { SET_SETTINGS } from "types/common";

export interface SettingObject {
  isDisplayingHelpers: boolean;
  isSubmittingApplication: boolean;
  isOpenRootDrawer: boolean;
  isOpenComponentStatusDrawer: boolean;
  isShowTopProgress: boolean;
}

export type State = ImmutableMap<SettingObject>;

const initialState: State = Immutable.Map({
  isDisplayingHelpers: window.localStorage.getItem("isDisplayingHelpers") === "true",
  isOpenRootDrawer: window.localStorage.getItem("isOpenRootDrawer") === "true",
  isOpenComponentStatusDrawer: window.localStorage.getItem("isOpenComponentStatusDrawer") === "true",
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
  window.localStorage.setItem("isOpenComponentStatusDrawer", state.get("isOpenComponentStatusDrawer").toString());

  return state;
};

export default reducer;
