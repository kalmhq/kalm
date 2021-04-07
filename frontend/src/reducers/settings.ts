import produce from "immer";
import { Actions } from "types";
import { SET_SETTINGS } from "types/common";

export interface SettingObject {
  isDisplayingHelpers: boolean;
  isSubmittingApplication: boolean;
  isOpenRootDrawer: boolean;
  isShowTopProgress: boolean;
  usingApplicationCard: boolean;
  usingTheme: string;
}

type State = SettingObject;

const initialState: State = {
  isDisplayingHelpers: window.localStorage.getItem("isDisplayingHelpers") === "true",
  isSubmittingApplication: false,
  isOpenRootDrawer: window.localStorage.getItem("isOpenRootDrawer") !== "false",
  usingApplicationCard: false,
  usingTheme: window.localStorage.getItem("usingTheme") ?? "light",
  isShowTopProgress: false,
};

const reducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case SET_SETTINGS: {
      state = Object.assign(state, action.payload);
      break;
    }
  }

  window.localStorage.setItem("isDisplayingHelpers", state.isDisplayingHelpers.toString());
  window.localStorage.setItem("isOpenRootDrawer", state.isOpenRootDrawer.toString());
  window.localStorage.setItem("usingApplicationCard", state.usingApplicationCard.toString());
  window.localStorage.setItem("usingTheme", state.usingTheme || "light");

  return state;
}, initialState);

export default reducer;
