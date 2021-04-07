export const SET_IS_SUBMITTING_REGISTRY = "SET_IS_SUBMITTING_REGISTRY";
export const LOAD_REGISTRIES_PENDING = "LOAD_REGISTRIES_PENDING";
export const LOAD_REGISTRIES_FULFILLED = "LOAD_REGISTRIES_FULFILLED";
export const LOAD_REGISTRIES_FAILED = "LOAD_REGISTRIES_FAILED";
export const CREATE_REGISTRY = "CREATE_REGISTRY";
export const UPDATE_REGISTRY = "UPDATE_REGISTRY";
export const DELETE_REGISTRY = "DELETE_REGISTRY";

export const PublicRegistriesList = [
  "docker.io",
  "gcr.io",
  "k8s.gcr.io",
  "us.gcr.io",
  "eu.gcr.io",
  "asia.gcr.io",
  "quay.io",
];

interface RepositoryTag {
  name: string;
  manifest: string;
  timeCreatedMs: string;
  timeUploadedMs: string;
}

interface Repository {
  name: string;
  tags: RepositoryTag[];
}

export interface Registry {
  name: string;
  username: string;
  password: string;
  host: string;
  poolingIntervalSeconds: number;
  authenticationVerified: boolean;
  repositories: Repository[];
}

export interface RegistryFormType {
  name: string;
  username: string;
  password: string;
  host: string;
}

export const newEmptyRegistry = (): RegistryFormType => {
  return {
    name: "",
    username: "",
    password: "",
    host: "",
  };
};

interface LoadRegistriesAction {
  type: typeof LOAD_REGISTRIES_FULFILLED;
  payload: {
    registries: Registry[];
  };
}

interface CreateRegistryAction {
  type: typeof CREATE_REGISTRY;
  payload: {
    registry: Registry;
  };
}

interface UpdateRegistryAction {
  type: typeof UPDATE_REGISTRY;
  payload: {
    registry: Registry;
  };
}

interface DeleteRegistryAction {
  type: typeof DELETE_REGISTRY;
  payload: {
    name: string;
  };
}

export interface SetIsSubmittingRegistry {
  type: typeof SET_IS_SUBMITTING_REGISTRY;
  payload: {
    isSubmittingRegistry: boolean;
  };
}

interface RegistriesStateAction {
  type: typeof LOAD_REGISTRIES_PENDING | typeof LOAD_REGISTRIES_FAILED;
}

export type RegistriesActions =
  | LoadRegistriesAction
  | RegistriesStateAction
  | CreateRegistryAction
  | UpdateRegistryAction
  | DeleteRegistryAction
  | SetIsSubmittingRegistry;
