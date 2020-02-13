// import { store } from "../index";
import { ConfigFormValues } from "../actions";
import { RootState } from "../reducers";
import { store } from "../store";

export const getCurrentConfig = (): ConfigFormValues => {
  const state = store.getState();
  const idChain = state.get("configs").get("currentConfigIdChain");
  return getConfigByIdChain(idChain);
};

export const getConfigByIdChain = (idChain: string[]): ConfigFormValues => {
  const state = store.getState();

  let config = state.get("configs").get("rootConfig");

  idChain.forEach((id: string) => {
    // exclude root config
    if (config.get("id") === id) {
      return;
    }

    config = config.get("children").get(id) as ConfigFormValues;
  });

  return config;
};
