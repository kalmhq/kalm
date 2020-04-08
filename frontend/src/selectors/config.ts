import { ConfigNode, initialRootConfigNode } from "../types/config";
import { store } from "../store";
import { CascaderOptionType } from "antd/es/cascader";
import Immutable from "immutable";

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

export const getCascaderOptions = (): CascaderOptionType[] => {
  const state = store.getState();

  let config = state.get("configs").get("rootConfig");
  const options: CascaderOptionType[] = [];
  options.push(configToCascaderOption(config));

  return options;
};

const configToCascaderOption = (config: ConfigNode): CascaderOptionType => {
  const children = config.get("children");

  let childrenHaveFolder = false;
  const cascaderOptionChildren: CascaderOptionType[] = [];

  children.forEach((childConfig: ConfigNode) => {
    if (childConfig.get("type") === "folder") {
      childrenHaveFolder = true;

      cascaderOptionChildren.push(configToCascaderOption(childConfig));
    }
  });

  if (config.get("id") === initialRootConfigNode.get("id")) {
    return {
      value: config.get("id"),
      label: "/",
      children: cascaderOptionChildren
    } as CascaderOptionType;
  }

  if (childrenHaveFolder) {
    return {
      value: config.get("id"),
      label: config.get("name"),
      children: cascaderOptionChildren
    } as CascaderOptionType;
  }

  return {
    value: config.get("id"),
    label: config.get("name")
  } as CascaderOptionType;
};
