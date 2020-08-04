import Immutable from "immutable";
import { Actions } from "types";
import { ImmutableMap } from "typings";
import { LOAD_SERVICES_FAILED, LOAD_SERVICES_FULFILLED, LOAD_SERVICES_PENDING, Service } from "types/service";
import {
  RESOURCE_ACTION_ADD,
  RESOURCE_ACTION_DELETE,
  RESOURCE_ACTION_UPDATE,
  RESOURCE_TYPE_SERVICE,
  WATCHED_RESOURCE_CHANGE,
} from "types/resources";
import { addOrUpdateInList, removeInList } from "reducers/utils";

export type State = ImmutableMap<{
  isLoading: boolean;
  isFirstLoaded: boolean;
  services: Immutable.List<Service>;
}>;

const initialState: State = Immutable.Map({
  isLoading: false,
  isFirstLoaded: false,
  services: Immutable.List([]),
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_SERVICES_PENDING: {
      return state.set("isLoading", true);
    }
    case LOAD_SERVICES_FAILED: {
      return state.set("isLoading", false);
    }
    case LOAD_SERVICES_FULFILLED: {
      state = state.set("isLoading", false);
      state = state.set("isFirstLoaded", true);
      state = state.set("services", action.payload.services);
      break;
    }
    case WATCHED_RESOURCE_CHANGE: {
      if (action.kind !== RESOURCE_TYPE_SERVICE) {
        return state;
      }

      switch (action.payload.action) {
        case RESOURCE_ACTION_ADD: {
          state = state.update("services", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_DELETE: {
          state = state.update("services", (x) => removeInList(x, action.payload.data));
          break;
        }
        case RESOURCE_ACTION_UPDATE: {
          state = state.update("services", (x) => addOrUpdateInList(x, action.payload.data));
          break;
        }
      }

      break;
    }
  }

  return state;
};

export default reducer;
