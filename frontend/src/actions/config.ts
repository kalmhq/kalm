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
import { getKappFiles, createKappFile, updateKappFile, deleteKappFile } from "./kubernetesApi";
import { convertToCRDFile } from "../convertors/File";

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;

export const createConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    config = config.set("id", config.get("type") === "file" ? randomName() : config.get("name"));

    if (config.get("type") === "file") {
      const configFile = configToConfigFile(config);
      await createKappFile(convertToCRDFile(configFile));
    }

    dispatch({
      type: CREATE_CONFIG,
      payload: { config }
    });

    const newIdChain = config.get("ancestorIds")!.toArray() || [];
    newIdChain.push(config.get("id"));
    dispatch(setCurrentConfigIdChainAction(newIdChain));
  };
};

export const duplicateConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    config = Immutable.fromJS({
      id: randomName(),
      name: config.get("name") + "-duplicate",
      type: config.get("type"),
      content: config.get("content"),
      ancestorIds: config.get("ancestorIds")
    });

    const configFile = configToConfigFile(config);
    await createKappFile(convertToCRDFile(configFile));

    dispatch({
      type: DUPLICATE_CONFIG,
      payload: { config }
    });

    const newIdChain = config.get("ancestorIds")!.toArray() || [];
    newIdChain.push(config.get("id"));
    dispatch(setCurrentConfigIdChainAction(newIdChain));
  };
};

export const updateConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const configFile = configToConfigFile(config);
    await updateKappFile(convertToCRDFile(configFile));

    dispatch({
      type: UPDATE_CONFIG,
      payload: { config }
    });

    const newIdChain = config.get("ancestorIds")!.toArray() || [];
    newIdChain.push(config.get("id"));
    dispatch(setCurrentConfigIdChainAction(newIdChain));

    dispatch(loadConfigsAction());
  };
};

export const deleteConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    const configFile = configToConfigFile(config);
    await deleteKappFile(convertToCRDFile(configFile));

    dispatch(setCurrentConfigIdChainAction(["0"]));
    dispatch({
      type: DELETE_CONFIG,
      payload: { config }
    });

    dispatch(loadConfigsAction());
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

export const configToConfigFile = (config: ConfigNode): ConfigFile => {
  const ancestorIds = config.get("ancestorIds")!.toArray() || [];

  let path = "";
  for (let i = 1; i <= ancestorIds.length - 1; i++) {
    path = path + "/" + ancestorIds[i];
  }
  path = path + "/" + config.get("name");
  const configFile: ConfigFile = Immutable.fromJS({
    id: config.get("id"),
    resourceVersion: config.get("resourceVersion"),
    name: config.get("name"),
    content: config.get("content"),
    path
  });

  return configFile;
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
      resourceVersion: configFile.get("resourceVersion"),
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
