import { connectRouter } from "connected-react-router/immutable";
import { History, LocationState } from "history";
import { FormState } from "redux-form";
import { reducer as formReducer } from "redux-form/immutable";
import { combineReducers } from "redux-immutable";
import { ImmutableMap } from "../typings";
import roles, { State as RolesState } from "./role";
import applications, { State as ApplicationState } from "./application";
import auth, { State as AuthState } from "./auth";
import componentTemplates, { State as ComponentTemplateState } from "./componentTemplate";
import configs, { State as ConfigState } from "./config";
import dependencies, { State as DependencyState } from "./dependency";
import dialogs, { State as DialogState } from "./dialog";
import namespaces, { State as NamespacesState } from "./namespaces";
import nodes, { State as NodesState } from "./node";
import registries, { State as RegistriesState } from "./registry";
import notification, { State as NotificationState } from "./notification";
import persistentVolumns, { State as PersistentVolumnsState } from "./persistentVolumn";
import settings, { State as SettingsState } from "./settings";
import users, { State as UserState } from "./user";

export type RootState = ImmutableMap<{
  componentTemplates: ComponentTemplateState;
  namespaces: NamespacesState;
  applications: ApplicationState;
  configs: ConfigState;
  auth: AuthState;
  router: ImmutableMap<any>; //RouterState<LocationState>;
  notification: NotificationState;
  dependencies: DependencyState;
  dialogs: DialogState;
  form: FormState;
  nodes: NodesState;
  registries: RegistriesState;
  persistentVolumns: PersistentVolumnsState;
  settings: SettingsState;
  users: UserState;
  roles: RolesState;
}>;

// combineReducers returns immutable map, but the type is not working correctly
// https://github.com/gajus/redux-immutable/issues/74

export default (history: History<LocationState>) =>
  combineReducers<RootState>({
    // @ts-ignore
    form: formReducer,
    namespaces,
    nodes,
    registries,
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
    roles
  });
