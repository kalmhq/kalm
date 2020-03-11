import { SettingObject } from "../reducers/settings";
import { SetSettingsAction, SET_SETTINGS } from ".";

export const setSettingsAction = (
  settings: Partial<SettingObject>
): SetSettingsAction => {
  return {
    type: SET_SETTINGS,
    payload: settings
  };
};
