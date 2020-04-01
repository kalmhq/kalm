import Immutable from "immutable";
import {
  getKappFilesV1alpha1,
  createKappFileV1alpha1,
  updateKappFileV1alpha1,
  moveKappFileV1alpha1,
  deleteKappFileV1alpha1
} from "./kubernetesApi";
import {
  ConfigNode,
  CREATE_CONFIG,
  UPDATE_CONFIG,
  DUPLICATE_CONFIG,
  DELETE_CONFIG,
  SET_CURRENT_CONFIG_ID_CHAIN,
  LOAD_CONFIGS_PENDING,
  LOAD_CONFIGS_FULFILLED,
  initialRootConfigNode,
  LOAD_CONFIGS_FAILED,
  ConfigRes
} from "../types/config";
import { ThunkResult, StatusFailure } from "../types";
import { setSuccessNotificationAction, setErrorNotificationAction } from "./notification";

export const createConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    config = config.set("id", config.get("name"));

    try {
      await createKappFileV1alpha1(getConfigPath(config), config.get("type") === "folder", config.get("content"));
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch(setSuccessNotificationAction("Create config successful."));

    dispatch({
      type: CREATE_CONFIG,
      payload: { config }
    });

    const newIdChain = config.get("ancestorIds").toArray() || [];
    newIdChain.push(config.get("id"));
    dispatch(setCurrentConfigIdChainAction(newIdChain));
  };
};

export const duplicateConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    config = Immutable.fromJS({
      id: config.get("name") + "-duplicate",
      name: config.get("name") + "-duplicate",
      type: config.get("type"),
      oldPath: "",
      content: config.get("content"),
      ancestorIds: config.get("ancestorIds")
    });
    config = config.set("oldPath", getConfigPath(config));

    try {
      await createKappFileV1alpha1(getConfigPath(config), config.get("type") === "folder", config.get("content"));
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch(setSuccessNotificationAction("Create config successful."));

    dispatch({
      type: DUPLICATE_CONFIG,
      payload: { config }
    });

    const newIdChain = config.get("ancestorIds").toArray() || [];
    newIdChain.push(config.get("id"));
    dispatch(setCurrentConfigIdChainAction(newIdChain));
  };
};

export const updateConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async dispatch => {
    config = config.set("id", config.get("name"));
    const newPath = getConfigPath(config);

    try {
      await updateKappFileV1alpha1(config.get("oldPath"), config.get("content"));
      if (newPath !== config.get("oldPath")) {
        await moveKappFileV1alpha1(config.get("oldPath"), newPath);
        config = config.set("oldPath", newPath);
      }
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch(setSuccessNotificationAction("Update config successful."));

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
    try {
      await deleteKappFileV1alpha1(getConfigPath(config));
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      return;
    }

    dispatch(setSuccessNotificationAction("Delete config successful."));

    dispatch(setCurrentConfigIdChainAction([initialRootConfigNode.get("id")]));
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

    let configRes;
    try {
      configRes = await getKappFilesV1alpha1();
    } catch (e) {
      if (e.response && e.response.data.status === StatusFailure) {
        dispatch(setErrorNotificationAction(e.response.data.message));
      } else {
        dispatch(setErrorNotificationAction());
      }
      dispatch({ type: LOAD_CONFIGS_FAILED });
      return;
    }

    const configNode = configResToConfigNode(configRes);
    dispatch({
      type: LOAD_CONFIGS_FULFILLED,
      payload: {
        configNode
      }
    });
  };
};

export const getConfigPath = (config: ConfigNode): string => {
  if (config.get("id") === initialRootConfigNode.get("id")) {
    return "/";
  }

  const ancestorIds = config.get("ancestorIds").toArray();

  let path = "";
  for (let i = 1; i <= ancestorIds.length - 1; i++) {
    path = path + "/" + ancestorIds[i];
  }
  path = path + "/" + config.get("name");

  return path;
};

export const pathToAncestorIds = (path: string): string[] => {
  const ancestorIds: string[] = [];

  if (path === "/") {
    return ancestorIds;
  }

  // eg.
  // "/a/b/c.yaml" =>
  // ["", "a", "b", "c.yaml"]
  const names = path.split("/");

  if (names.length < 2) {
    return ancestorIds;
  }

  for (let i = 1; i < names.length - 1; i++) {
    ancestorIds.push(names[i]);
  }
  return ancestorIds;
};

export const configResToConfigNode = (configRes: ConfigRes): ConfigNode => {
  let children = Immutable.OrderedMap({});
  if (configRes.children) {
    configRes.children.forEach(child => {
      // recursive convert children
      children = children.set(child.name, configResToConfigNode(child));
    });
  }

  return Immutable.fromJS({
    id: configRes.name || initialRootConfigNode.get("name"),
    name: configRes.name || initialRootConfigNode.get("name"),
    type: configRes.isDir ? "folder" : "file",
    oldPath: configRes.path,
    content: configRes.content,
    children,
    ancestorIds: pathToAncestorIds(configRes.path)
  });
};
