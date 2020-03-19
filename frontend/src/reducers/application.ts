import Immutable from "immutable";
import {
  Actions,
  FormApplication,
  CREATE_APPLICATION,
  DELETE_APPLICATION,
  DUPLICATE_APPLICATION,
  LOAD_APPLICATIONS_FULFILLED,
  LOAD_APPLICATIONS_PENDING,
  UPDATE_APPLICATION
} from "../actions";
import { ImmutableMap } from "../typings";

export type State = ImmutableMap<{
  applications: Immutable.OrderedMap<string, FormApplication>;
  isListLoading: boolean;
  isListFirstLoaded: boolean;
}>;

const initialState: State = Immutable.Map({
  applications: Immutable.OrderedMap({}),
  isListLoading: false,
  isListFirstLoaded: false
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_APPLICATIONS_PENDING: {
      state = state.set("isListLoading", true);
      break;
    }
    case LOAD_APPLICATIONS_FULFILLED: {
      state = state.set("isListFirstLoaded", true).set("isListLoading", false);
      let om = Immutable.OrderedMap<string, FormApplication>();

      action.payload.applications.forEach(x => {
        om = om.set(x.get("id"), x);
      });

      state = state.set("applications", om);
      break;
    }
    case CREATE_APPLICATION: {
      const applications = state.get("applications");

      let application = action.payload.application;

      state = state.set("applications", applications.set(application.get("id"), application));
      break;
    }
    case DUPLICATE_APPLICATION: {
      const applications = state.get("applications");

      let application = action.payload.application;

      state = state.set("applications", applications.set(application.get("id"), application));
      break;
    }
    case UPDATE_APPLICATION: {
      const applications = state.get("applications");

      let application = action.payload.application;

      state = state.set("applications", applications.set(application.get("id"), application));
      break;
    }
    case DELETE_APPLICATION: {
      state = state.deleteIn(["applications", action.payload.applicationId]);
      break;
    }
  }

  return state;
};

export default reducer;
