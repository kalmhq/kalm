import { Store } from "redux";
import { RootState } from "./reducers";

export let store: Store<RootState, any>;

export const setStore = (storeCreated: any) => {
  store = storeCreated;
};
