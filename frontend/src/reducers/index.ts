import { connectRouter } from "connected-react-router";
import { History, LocationState } from "history";
import deployAccessTokens, { State as DeployAccessTokensState } from "reducers/deployAccessToken";
import roles, { State as RolesState } from "reducers/roleBinding";
import { combineReducers } from "redux";
import applications, { State as ApplicationState } from "./application";
import auth, { State as AuthState } from "./auth";
import certificates, { State as CertificateState } from "./certificate";
import cluster, { State as ClusterState } from "./cluster";
import components, { State as ApplicationComponentState } from "./component";
import debounce, { State as DebounceState } from "./debounce";
import dialogs, { State as DialogState } from "./dialog";
import domains, { State as DomainsState } from "./domains";
import namespaces, { State as NamespacesState } from "./namespaces";
import nodes, { State as NodesState } from "./node";
import notification, { State as NotificationState } from "./notification";
import persistentVolumes, { State as PersistentVolumesState } from "./persistentVolume";
import registries, { State as RegistriesState } from "./registry";
import routes, { State as RouteState } from "./route";
import services, { State as ServiceState } from "./service";
import settings, { State as SettingsState } from "./settings";
import sso, { State as SSOState } from "./sso";
import tutorial, { State as TutorialState } from "./tutorial";

export type RootState = {
  namespaces: NamespacesState;
  applications: ApplicationState;
  components: ApplicationComponentState;
  auth: AuthState;
  router: any; //RouterState<LocationState>;
  notification: NotificationState;
  dialogs: DialogState;
  nodes: NodesState;
  registries: RegistriesState;
  persistentVolumes: PersistentVolumesState;
  settings: SettingsState;
  roles: RolesState;
  routes: RouteState;
  cluster: ClusterState;
  tutorial: TutorialState;
  services: ServiceState;
  certificates: CertificateState;
  debounce: DebounceState;
  sso: SSOState;
  deployAccessTokens: DeployAccessTokensState;
  domains: DomainsState;
};

const rootReducer = (history: History<LocationState>) =>
  combineReducers<RootState>({
    namespaces,
    nodes,
    registries,
    auth,
    dialogs,
    router: connectRouter(history),
    persistentVolumes,
    applications,
    components,
    notification,
    settings,
    sso,
    roles,
    routes,
    tutorial,
    cluster,
    services,
    certificates,
    debounce,
    deployAccessTokens,
    domains,
  });

export default rootReducer;
