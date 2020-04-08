import { combineReducers } from "redux-immutable";
import { reducer as formReducer } from "redux-form/immutable";
import { FormState } from "redux-form";
import settings, { State as SettingsState } from "./settings";
import admin, { State as AdminState } from "./admin";
import notification, { State as NotificationState } from "./notification";
import namespaces, { State as NamespacesState } from "./namespaces";
import dialogs, { State as DialogState } from "./dialog";
import componentTemplates, { State as ComponentTemplateState } from "./componentTemplate";
import applications, { State as ApplicationState } from "./application";
import dependencies, { State as DependencyState } from "./dependency";
import auth, { State as AuthState } from "./auth";
import nodes, { State as NodesState } from "./node";
import persistentVolumns, { State as PersistentVolumnsState } from "./persistentVolumn";
import configs, { State as ConfigState } from "./config";
import users, { State as UserState } from "./user";
import { connectRouter, RouterState } from "connected-react-router/immutable";
import { History, LocationState } from "history";
import { ImmutableMap } from "../typings";

export type RootState = ImmutableMap<{
  componentTemplates: ComponentTemplateState;
  namespaces: NamespacesState;
  applications: ApplicationState;
  configs: ConfigState;
  auth: AuthState;
  router: RouterState<LocationState>;
  notification: NotificationState;
  dependencies: DependencyState;
  dialogs: DialogState;
  form: FormState;
  nodes: NodesState;
  persistentVolumns: PersistentVolumnsState;
  settings: SettingsState;
  users: UserState;
  admin: AdminState;
}>;

// combineReducers returns immutable map, but the type is not working correctly
// https://github.com/gajus/redux-immutable/issues/74

export default (history: History<LocationState>) =>
  combineReducers<RootState>({
    // @ts-ignore
    form: formReducer,
    namespaces,
    nodes,
    auth,
    dialogs,
    dependencies,
    router: connectRouter(history),
    componentTemplates,
    persistentVolumns,
    applications,
    configs,
    notification,
    settings,
    users,
    admin
  });
