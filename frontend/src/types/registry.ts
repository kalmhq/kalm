import { ImmutableMap } from "typings";
import Immutable from "immutable";

export const LOAD_REGISTRIES_PENDING = "LOAD_REGISTRIES_PENDING";
export const LOAD_REGISTRIES_FULFILlED = "LOAD_REGISTRIES_FULFILlED";
export const LOAD_REGISTRIES_FAILED = "LOAD_REGISTRIES_FAILED";

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
  type: typeof LOAD_REGISTRIES_FULFILlED;
  payload: Immutable.List<RegistryType>;
}

export interface RegistriesStateAction {
  type: typeof LOAD_REGISTRIES_PENDING | typeof LOAD_REGISTRIES_FAILED;
}

export type RegistriesActions = LoadRegistriesAction | RegistriesStateAction;
