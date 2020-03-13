import { ThunkAction } from "redux-thunk";
import { RootState } from "../reducers";
import {
  CREATE_CONFIG,
  Actions,
  UPDATE_CONFIG,
  DELETE_CONFIG,
  ConfigNode,
  SET_CURRENT_CONFIG_ID_CHAIN,
  DUPLICATE_CONFIG,
  LOAD_CONFIGS_PENDING,
  LOAD_CONFIGS_FULFILLED,
  ConfigFile
} from ".";
import Immutable from "immutable";
import { randomName } from "../utils";
import { getKappFiles, createKappFile } from "./kubernetesApi";
import { convertToCRDFile } from "../convertors/File";

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;

export const createConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    config = config.set("id", randomName()); // TODO fake id now

    console.log("ancestorIds", config.get("ancestorIds")?.toJS());
    const ancestorIds = config.get("ancestorIds")!.toArray() || [];
    let path = "";
    for (let i = 1; i <= ancestorIds.length - 1; i++) {
      path = path + "/" + ancestorIds[i];
    }
    path = path + "/" + config.get("name");
    const configFile: ConfigFile = Immutable.fromJS({
      id: config.get("id"),
      name: config.get("name"),
      content: config.get("content"),
      path
    });

    const resConfig = await createKappFile(convertToCRDFile(configFile));
    console.log("resConfig", resConfig);

    const newIdChain = ancestorIds;
    newIdChain.push(config.get("id"));

    dispatch({
      type: CREATE_CONFIG,
      payload: { config }
    });
    dispatch(setCurrentConfigIdChainAction(newIdChain));
  };
};

export const duplicateConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  config = Immutable.fromJS({
    id: randomName(), // TODO fake id now
    name: config.get("name") + "-duplicate",
    type: config.get("type"),
    content: config.get("content"),
    ancestorIds: config.get("ancestorIds")
  });

  const newIdChain = config.get("ancestorIds") ? config.get("ancestorIds")!.toArray() : [];
  newIdChain.push(config.get("id"));
  return async dispatch => {
    dispatch({
      type: DUPLICATE_CONFIG,
      payload: { config }
    });
    dispatch(setCurrentConfigIdChainAction(newIdChain));
  };
};

export const updateConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: UPDATE_CONFIG,
      payload: { config }
    });
  };
};

export const deleteConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch(setCurrentConfigIdChainAction(["0"]));
    dispatch({
      type: DELETE_CONFIG,
      payload: { config }
    });
  };
};

export const setCurrentConfigIdChainAction = (idChain: string[]): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({
      type: SET_CURRENT_CONFIG_ID_CHAIN,
      payload: { idChain }
    });
  };
};

export const loadConfigsAction = (): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch({ type: LOAD_CONFIGS_PENDING });

    const configs = await getKappFiles();
    const configNode = configsToConfigNode(configs);
    dispatch({
      type: LOAD_CONFIGS_FULFILLED,
      payload: {
        configNode
      }
    });
  };
};

// file list to file tree
export const configsToConfigNode = (configs: ConfigFile[]): ConfigNode => {
  let rootConfig: ConfigNode = Immutable.fromJS({
    id: "0",
    type: "folder",
    name: "/",
    content: "",
    children: {}
  });

  for (let configFile of configs) {
    const immutablePath: string[] = ["children"];
    const paths = configFile.get("path").split("/");
    // eg    /a/b/c/d.yml  =>  ["", "a", "b", "c", "d.yml"]
    // so for folders(a,b,c) we use index 1,2,3
    for (let i = 1; i <= paths.length - 2; i++) {
      immutablePath.push(paths[i]);
      const config: ConfigNode = Immutable.fromJS({
        id: paths[i],
        type: "folder",
        name: paths[i],
        content: "",
        children: {}
      });
      rootConfig = rootConfig.updateIn(immutablePath, (originConfig: ConfigNode) => {
        if (originConfig) {
          return originConfig;
        }
        return config;
      });
      immutablePath.push("children");
    }
    immutablePath.push(configFile.get("id"));
    const config: ConfigNode = Immutable.fromJS({
      id: configFile.get("id"),
      type: "file",
      name: configFile.get("name"),
      content: configFile.get("content"),
      children: {}
    });
    rootConfig = rootConfig.updateIn(immutablePath, () => config);
  }
  // console.log("rootConfig", rootConfig.toJS());

  return rootConfig;
};
