import { combineReducers } from "redux-immutable";
import { reducer as formReducer } from "redux-form/immutable";
import { FormState } from "redux-form";
import settings, { State as SettingsState } from "./settings";
import notification, { State as NotificationState } from "./notification";
import dialogs, { State as DialogState } from "./dialog";
import componentTemplates, { State as ComponentTemplateState } from "./componentTemplate";
import applications, { State as ApplicationState } from "./application";
import nodes, { State as NodesState } from "./node";
import persistentVolumns, { State as PersistentVolumnsState } from "./persistentVolumn";
import configs, { State as ConfigState } from "./config";
import { connectRouter, RouterState } from "connected-react-router/immutable";
import { History, LocationState } from "history";
import { ImmutableMap } from "../typings";

export type RootState = ImmutableMap<{
  componentTemplates: ComponentTemplateState;
  applications: ApplicationState;
  configs: ConfigState;
  router: RouterState<LocationState>;
  notification: NotificationState;
  dialogs: DialogState;
  form: FormState;
  nodes: NodesState;
  persistentVolumns: PersistentVolumnsState;
  settings: SettingsState;
}>;

// combineReducers returns immutable map, but the type is not working correctly
// https://github.com/gajus/redux-immutable/issues/74

export default (history: History<LocationState>) =>
  combineReducers<RootState>({
    // @ts-ignore
    form: formReducer,
    nodes,
    dialogs,
    router: connectRouter(history),
    componentTemplates,
    persistentVolumns,
    applications,
    configs,
    notification,
    settings
  });
