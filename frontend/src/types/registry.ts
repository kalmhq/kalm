import { ImmutableMap } from "typings";
import Immutable from "immutable";

export const SET_IS_SUBMITTING_REGISTRY = "SET_IS_SUBMITTING_REGISTRY";
export const LOAD_REGISTRIES_PENDING = "LOAD_REGISTRIES_PENDING";
export const LOAD_REGISTRIES_FULFILLED = "LOAD_REGISTRIES_FULFILLED";
export const LOAD_REGISTRIES_FAILED = "LOAD_REGISTRIES_FAILED";
export const CREATE_REGISTRY = "CREATE_REGISTRY";
export const UPDATE_REGISTRY = "UPDATE_REGISTRY";
export const DELETE_REGISTRY = "DELETE_REGISTRY";

export interface RepositoryTagContent {
  name: string;
  manifest: string;
  timeCreatedMs: string;
  timeUploadedMs: string;
}

export type RepositoryTag = ImmutableMap<RepositoryTagContent>;

export interface RepositoryContent {
  name: string;
  tags: Immutable.List<RepositoryTag>;
}

export type Repository = ImmutableMap<RepositoryContent>;

export interface Registry {
  name: string;
  username: string;
  password: string;
  host: string;
  poolingIntervalSeconds: number;
  authenticationVerified: boolean;
  repositories: Immutable.List<Repository>;
}

export type RegistryType = ImmutableMap<Registry>;

export interface LoadRegistriesAction {
  type: typeof LOAD_REGISTRIES_FULFILLED;
  payload: {
    registries: Immutable.List<RegistryType>;
  };
}

export interface CreateRegistryAction {
  type: typeof CREATE_REGISTRY;
  payload: {
    registry: RegistryType;
  };
}

export interface UpdateRegistryAction {
  type: typeof UPDATE_REGISTRY;
  payload: {
    registry: RegistryType;
  };
}

export interface DeleteRegistryAction {
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

export interface RegistriesStateAction {
  type: typeof LOAD_REGISTRIES_PENDING | typeof LOAD_REGISTRIES_FAILED;
}

export type RegistriesActions =
  | LoadRegistriesAction
  | RegistriesStateAction
  | CreateRegistryAction
  | UpdateRegistryAction
  | DeleteRegistryAction
  | SetIsSubmittingRegistry;
