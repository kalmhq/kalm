import { User } from "types/user";
import { store } from "store";

export const getUserByName = (name: string): User => {
  const state = store.getState();
  return state.get("users").get("users").get(name) as User;
};
