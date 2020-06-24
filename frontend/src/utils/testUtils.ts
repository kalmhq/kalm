import { Store } from "redux";

export const getTestFormSyncErrors = (store: Store, formID: string) => {
  return store.getState().get("form").get(formID).get("syncErrors");
};
