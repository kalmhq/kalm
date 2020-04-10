import { ConfigNode, initialRootConfigNode } from "../types/config";
import { store } from "../store";
import { CascaderOptionType } from "antd/es/cascader";
import Immutable from "immutable";

export const getConfigFilePaths = (): string[] => {
  const state = store.getState();
  return state
    .get("configs")
    .get("configFilePaths")
    .toArray();
};

export const getCurrentConfig = (): ConfigNode => {
  const state = store.getState();
  const idChain = state.get("configs").get("currentConfigIdChain");
  return getConfigByIdChain(idChain);
};

export const getConfigByIdChain = (idChain: string[]): ConfigNode => {
  const state = store.getState();
  let config = state.get("configs").get("rootConfig");

  idChain.forEach((id: string) => {
    // exclude root config
    if (config.get("id") === id) {
      return;
    }

    config = config.get("children").get(id) as ConfigNode;
  });

  const newIdChain = idChain.slice(0);
  newIdChain.splice(-1, 1);
  config = config.set("ancestorIds", Immutable.fromJS(newIdChain));

  return config;
};

export const getAncestorIdsDefaultValue = (): string[] => {
  const state = store.getState();
  const idChain = state.get("configs").get("currentConfigIdChain");
  const currentConfig = getConfigByIdChain(idChain);

  if (currentConfig.get("type") === "folder") {
    return idChain;
  }

  const newIdChain = idChain.slice(0);
  newIdChain.splice(-1, 1);
  return newIdChain;
};

export const getCascaderOptions = (isSelectFolder: boolean = true): CascaderOptionType[] => {
  const state = store.getState();

  let config = state.get("configs").get("rootConfig");
  const options: CascaderOptionType[] = [];
  options.push(configToCascaderOption(config, isSelectFolder));

  return options;
};

const configToCascaderOption = (config: ConfigNode, isSelectFolder: boolean = true): CascaderOptionType => {
  const children = config.get("children");

  const cascaderOptionChildren: CascaderOptionType[] = [];

  children.forEach((childConfig: ConfigNode) => {
    if (childConfig.get("type") === "folder") {
      if (isSelectFolder) {
        cascaderOptionChildren.push(configToCascaderOption(childConfig, isSelectFolder));
      } else if (childConfig.get("children").size > 0) {
        cascaderOptionChildren.push(configToCascaderOption(childConfig, isSelectFolder));
      }
    } else if (!isSelectFolder) {
      cascaderOptionChildren.push(configToCascaderOption(childConfig, isSelectFolder));
    }
  });

  if (config.get("id") === initialRootConfigNode.get("id")) {
    return {
      value: config.get("id"),
      label: "/",
      children: cascaderOptionChildren
    } as CascaderOptionType;
  }

  return {
    value: config.get("id"),
    label: config.get("name"),
    children: cascaderOptionChildren
  } as CascaderOptionType;
};
