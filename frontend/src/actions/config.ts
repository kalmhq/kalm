import Immutable from "immutable";
import { ThunkResult } from "../types";
import {
  ConfigCreate,
  ConfigNode,
  ConfigRes,
  CREATE_CONFIG,
  DELETE_CONFIG,
  DUPLICATE_CONFIG,
  FilesUpload,
  initialRootConfigNode,
  LOAD_CONFIGS_FAILED,
  LOAD_CONFIGS_FULFILLED,
  LOAD_CONFIGS_PENDING,
  SET_CURRENT_CONFIG_ID_CHAIN,
  SET_IS_SUBMITTING_CONFIG,
  SetIsSubmittingConfig,
  UPDATE_CONFIG,
} from "../types/config";
import {
  createKappFilesV1alpha1,
  deleteKappFileV1alpha1,
  getKappFilesV1alpha1,
  moveKappFileV1alpha1,
  updateKappFileV1alpha1,
} from "./kubernetesApi";
import { setSuccessNotificationAction } from "./notification";

export const uploadConfigsAction = (ancestorIds: string[], filesUpload: FilesUpload): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    // console.log("files", filesUpload.toJS());
    dispatch(setIsSubmittingConfig(true));

    const files: ConfigCreate[] = [];
    filesUpload.forEach((content, name) => {
      files.push({
        path: ancestorIdsToPath(ancestorIds, name),
        isDir: false,
        content,
      });
    });

    try {
      await createKappFilesV1alpha1(files);
    } catch (e) {
      dispatch(setIsSubmittingConfig(false));
      throw e;
    }
    dispatch(setIsSubmittingConfig(false));

    dispatch(loadConfigsAction());
    dispatch(setSuccessNotificationAction("Upload configs successful."));
    dispatch(setCurrentConfigIdChainAction(ancestorIds));
  };
};

export const createConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    config = config.set("id", config.get("name"));

    dispatch(setIsSubmittingConfig(true));

    const files = [
      {
        path: getConfigPath(config),
        isDir: config.get("type") === "folder",
        content: config.get("content"),
      },
    ];

    try {
      await createKappFilesV1alpha1(files);
    } catch (e) {
      dispatch(setIsSubmittingConfig(false));
      throw e;
    }
    dispatch(setIsSubmittingConfig(false));

    dispatch(setSuccessNotificationAction("Create config successful."));

    dispatch({
      type: CREATE_CONFIG,
      payload: { config },
    });

    const newIdChain = config.get("ancestorIds").toArray() || [];
    newIdChain.push(config.get("id"));
    dispatch(setCurrentConfigIdChainAction(newIdChain));
  };
};

export const duplicateConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    config = Immutable.fromJS({
      id: config.get("name") + "-duplicate",
      name: config.get("name") + "-duplicate",
      type: config.get("type"),
      oldPath: "",
      content: config.get("content"),
      ancestorIds: config.get("ancestorIds"),
    });
    config = config.set("oldPath", getConfigPath(config));

    const files = [
      {
        path: getConfigPath(config),
        isDir: config.get("type") === "folder",
        content: config.get("content"),
      },
    ];
    await createKappFilesV1alpha1(files);

    dispatch(setSuccessNotificationAction("Create config successful."));

    dispatch({
      type: DUPLICATE_CONFIG,
      payload: { config },
    });

    const newIdChain = config.get("ancestorIds").toArray() || [];
    newIdChain.push(config.get("id"));
    dispatch(setCurrentConfigIdChainAction(newIdChain));
  };
};

export const updateConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    config = config.set("id", config.get("name"));
    const newPath = getConfigPath(config);

    dispatch(setIsSubmittingConfig(true));

    try {
      await updateKappFileV1alpha1(config.get("oldPath"), config.get("content"));
      if (newPath !== config.get("oldPath")) {
        await moveKappFileV1alpha1(config.get("oldPath"), newPath);
        config = config.set("oldPath", newPath);
      }
    } catch (e) {
      dispatch(setIsSubmittingConfig(false));
      throw e;
    }
    dispatch(setIsSubmittingConfig(false));

    dispatch(setSuccessNotificationAction("Update config successful."));

    dispatch({
      type: UPDATE_CONFIG,
      payload: { config },
    });

    const newIdChain = config.get("ancestorIds")!.toArray() || [];
    newIdChain.push(config.get("id"));
    dispatch(setCurrentConfigIdChainAction(newIdChain));

    dispatch(loadConfigsAction());
  };
};

export const deleteConfigAction = (config: ConfigNode): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    await deleteKappFileV1alpha1(getConfigPath(config));

    dispatch(setSuccessNotificationAction("Delete config successful."));

    dispatch(setCurrentConfigIdChainAction([initialRootConfigNode.get("id")]));
    dispatch({
      type: DELETE_CONFIG,
      payload: { config },
    });

    dispatch(loadConfigsAction());
  };
};

export const setCurrentConfigIdChainAction = (idChain: string[]): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({
      type: SET_CURRENT_CONFIG_ID_CHAIN,
      payload: { idChain },
    });
  };
};

export const loadConfigsAction = (namespace?: string): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_CONFIGS_PENDING });

    let configRes;
    try {
      configRes = await getKappFilesV1alpha1(namespace);
    } catch (e) {
      dispatch({ type: LOAD_CONFIGS_FAILED });
      throw e;
    }

    const configNode = configResToConfigNode(configRes);
    dispatch({
      type: LOAD_CONFIGS_FULFILLED,
      payload: {
        configNode,
      },
    });
  };
};

export const getConfigPath = (config: ConfigNode): string => {
  if (config.get("id") === initialRootConfigNode.get("id")) {
    return "/";
  }

  const ancestorIds = config.get("ancestorIds").toArray();
  const name = config.get("name");
  return ancestorIdsToPath(ancestorIds, name);
};

export const ancestorIdsToPath = (ancestorIds: string[], name: string): string => {
  let path = "";
  for (let i = 1; i <= ancestorIds.length - 1; i++) {
    path = path + "/" + ancestorIds[i];
  }
  path = path + "/" + name;

  return path;
};

export const pathToAncestorIds = (path: string): string[] => {
  const ancestorIds: string[] = [initialRootConfigNode.get("id")];

  if (path === "/") {
    return ancestorIds;
  }

  // eg.
  // split "/a/b/c.yaml" =>
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
    configRes.children.forEach((child) => {
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
    ancestorIds: pathToAncestorIds(configRes.path),
  });
};

export const setIsSubmittingConfig = (isSubmittingConfig: boolean): SetIsSubmittingConfig => {
  return {
    type: SET_IS_SUBMITTING_CONFIG,
    payload: {
      isSubmittingConfig,
    },
  };
};
