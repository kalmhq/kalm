import { connectRouter } from "connected-react-router/immutable";
import { History, LocationState } from "history";
import { combineReducers } from "redux-immutable";
import { ImmutableMap } from "typings";
import applications, { State as ApplicationState } from "./application";
import components, { State as ApplicationComponentState } from "./component";
import auth, { State as AuthState } from "./auth";
import dialogs, { State as DialogState } from "./dialog";
import namespaces, { State as NamespacesState } from "./namespaces";
import nodes, { State as NodesState } from "./node";
import registries, { State as RegistriesState } from "./registry";
import notification, { State as NotificationState } from "./notification";
import persistentVolumes, { State as PersistentVolumesState } from "./persistentVolume";
import settings, { State as SettingsState } from "./settings";
import routes, { State as RouteState } from "./route";
import cluster, { State as ClusterState } from "./cluster";
import tutorial, { State as TutorialState } from "./tutorial";
import services, { State as ServiceState } from "./service";
import certificates, { State as CertificateState } from "./certificate";
import debounce, { State as DebounceState } from "./debounce";
import sso, { State as SSOState } from "./sso";
import domain, { State as DomainState } from "./domain";
import deployKeys, { State as DeployKeysState } from "./deployKey";

export type RootState = ImmutableMap<{
  namespaces: NamespacesState;
  applications: ApplicationState;
  components: ApplicationComponentState;
  auth: AuthState;
  router: ImmutableMap<any>; //RouterState<LocationState>;
  notification: NotificationState;
  dialogs: DialogState;
  nodes: NodesState;
  registries: RegistriesState;
  persistentVolumes: PersistentVolumesState;
  settings: SettingsState;
  routes: RouteState;
  cluster: ClusterState;
  tutorial: TutorialState;
  services: ServiceState;
  certificates: CertificateState;
  debounce: DebounceState;
  sso: SSOState;
  deployKeys: DeployKeysState;
  domain: DomainState;
}>;

// combineReducers returns immutable map, but the type is not working correctly
// https://github.com/gajus/redux-immutable/issues/74

export default (history: History<LocationState>) =>
  combineReducers<RootState>({
    // @ts-ignore
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
    routes,
    tutorial,
    cluster,
    services,
    certificates,
    debounce,
    domain,
    deployKeys,
  });
