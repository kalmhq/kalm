// import { store } from "../index";
import { Config } from "../actions";
import { RootState } from "../reducers";
import { store } from "../store";
import { CascaderOptionType } from "antd/es/cascader";

export const getCurrentConfig = (): Config => {
  const state = store.getState();
  const idChain = state.get("configs").get("currentConfigIdChain");
  return getConfigByIdChain(idChain);
};

export const getConfigByIdChain = (idChain: string[]): Config => {
  const state = store.getState();
  let config = state.get("configs").get("rootConfig");

  idChain.forEach((id: string) => {
    // exclude root config
    if (config.get("id") === id) {
      return;
    }

    config = config.get("children").get(id) as Config;
  });

  return config;
};

export const getCascaderDefaultValue = (): string[] => {
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

const configToCascaderOption = (config: Config): CascaderOptionType => {
  const children = config.get("children");

  let childrenHaveFolder = false;
  const cascaderOptionChildren: CascaderOptionType[] = [];

  children.forEach((childConfig: Config) => {
    if (childConfig.get("type") === "folder") {
      childrenHaveFolder = true;

      cascaderOptionChildren.push(configToCascaderOption(childConfig));
    }
  });

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
