import { SettingObject } from "../reducers/settings";
import { SetSettingsAction, SET_SETTINGS } from "../types/common";

export const setSettingsAction = (settings: Partial<SettingObject>): SetSettingsAction => {
  return {
    type: SET_SETTINGS,
    payload: settings
  };
};
