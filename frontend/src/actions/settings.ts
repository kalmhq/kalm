import { SettingObject } from "reducers/settings";
import { store } from "store";
import { SetSettingsAction, SET_SETTINGS } from "types/common";

export const setSettingsAction = (settings: Partial<SettingObject>): SetSettingsAction => {
  return {
    type: SET_SETTINGS,
    payload: settings,
  };
};

export const blinkTopProgressAction = (milliseconds?: number) => {
  store.dispatch(setSettingsAction({ isShowTopProgress: true }));
  setTimeout(
    () => {
      store.dispatch(setSettingsAction({ isShowTopProgress: false }));
    },
    milliseconds === undefined ? milliseconds : 2000,
  );
};
