import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import {
  CREATE_CONFIG,
  ConfigNode,
  UPDATE_CONFIG,
  DELETE_CONFIG,
  SET_CURRENT_CONFIG_ID_CHAIN,
  DUPLICATE_CONFIG,
  LOAD_CONFIGS_FULFILLED,
  LOAD_CONFIGS_PENDING,
  LOAD_CONFIGS_FAILED,
  initialRootConfigNode
} from "../types/config";
import { Actions } from "../types";

export type State = ImmutableMap<{
  currentConfigIdChain: string[];
  rootConfig: ConfigNode;
  isListLoading: boolean;
  isListFirstLoaded: boolean;
}>;

const initialState: State = Immutable.Map({
  currentConfigIdChain: [initialRootConfigNode.get("id")],
  rootConfig: initialRootConfigNode
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_CONFIGS_PENDING: {
      state = state.set("isListLoading", true);
      break;
    }
    case LOAD_CONFIGS_FAILED: {
      state = state.set("isListLoading", false);
      break;
    }
    case LOAD_CONFIGS_FULFILLED: {
      state = state.set("isListFirstLoaded", true).set("isListLoading", false);
      const configNode = action.payload.configNode;

      state = state.set("rootConfig", configNode);
      break;
    }
    case SET_CURRENT_CONFIG_ID_CHAIN: {
      const idChain = action.payload.idChain;
      state = state.set("currentConfigIdChain", idChain);
      break;
    }
    case CREATE_CONFIG: {
      const configForm = action.payload.config;
      const ancestorIds = configForm.get("ancestorIds");
      const rootConfig = state.get("rootConfig");
      const immutablePath: string[] = ["rootConfig"];

      ancestorIds.forEach((id: string) => {
        if (id !== rootConfig.get("id")) {
          immutablePath.push(id);
        }
        immutablePath.push("children");
      });

      const config: ConfigNode = Immutable.fromJS({
        id: configForm.get("id"),
        type: configForm.get("type"),
        name: configForm.get("name"),
        content: configForm.get("content"),
        children: configForm.get("children"),
        ancestorIds
      });

      immutablePath.push(config.get("id"));
      state = state.updateIn(immutablePath, () => config);
      break;
    }
    case DUPLICATE_CONFIG: {
      const configForm = action.payload.config;
      const ancestorIds = configForm.get("ancestorIds");
      const rootConfig = state.get("rootConfig");
      const immutablePath: string[] = ["rootConfig"];

      ancestorIds.forEach((id: string) => {
        if (id !== rootConfig.get("id")) {
          immutablePath.push(id);
        }
        immutablePath.push("children");
      });

      const config: ConfigNode = Immutable.fromJS({
        id: configForm.get("id"),
        type: configForm.get("type"),
        name: configForm.get("name"),
        content: configForm.get("content"),
        ancestorIds
      });

      immutablePath.push(config.get("id"));
      state = state.updateIn(immutablePath, () => config);
      break;
    }
    case UPDATE_CONFIG: {
      const configForm = action.payload.config;
      const ancestorIds = configForm.get("ancestorIds");
      const rootConfig = state.get("rootConfig");
      const immutablePath: string[] = ["rootConfig"];

      ancestorIds.forEach((id: string) => {
        if (id !== rootConfig.get("id")) {
          immutablePath.push(id);
        }
        immutablePath.push("children");
      });

      const config: ConfigNode = Immutable.fromJS({
        id: configForm.get("id"),
        type: configForm.get("type"),
        name: configForm.get("name"),
        content: configForm.get("content"),
        ancestorIds
      });

      immutablePath.push(config.get("id"));
      state = state.updateIn(immutablePath, () => config);
      break;
    }
    case DELETE_CONFIG: {
      const configForm = action.payload.config;
      const ancestorIds = configForm.get("ancestorIds");
      const rootConfig = state.get("rootConfig");
      const immutablePath: string[] = ["rootConfig"];

      ancestorIds.forEach((id: string) => {
        if (id !== rootConfig.get("id")) {
          immutablePath.push(id);
        }
        immutablePath.push("children");
      });
      immutablePath.push(configForm.get("id"));

      state = state.deleteIn(immutablePath);
      break;
    }
  }

  return state;
};

export default reducer;
