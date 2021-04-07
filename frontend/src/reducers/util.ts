import produce from "immer";
import { Actions, Resources } from "../types";

type KindState<T> = { [key: string]: T };

const makeKindInitialState = <T>(): KindState<T> => {
  return {};
};

// TODO: How to fix the typing ????
export const makeReducerForKind = <T = Resources>(kind: string, initialState: KindState<T>) => {
  return produce((state: KindState<T>, action: Actions) => {
    // @ts-ignore
    if (!action.payload || !action.payload || action.payload.kind !== kind) {
      return state;
    }

    switch (action.type) {
      case "ADDED": {
        if (action.payload.kind !== kind) {
          return state;
        }
        // @ts-ignore
        state[action.payload.metadata.name] = action.payload;
        break;
      }
      case "DELETED": {
        delete state[action.payload.metadata.name];
        break;
      }
      case "MODIFIED": {
        // @ts-ignore
        state[action.payload.metadata.name] = action.payload;
        break;
      }
    }

    return state;
  }, initialState);
};
