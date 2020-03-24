import Immutable from "immutable";
import { Actions } from "../types";
import { ImmutableMap } from "../typings";
import {
  ApplicationList,
  Application,
  LOAD_APPLICATIONS_PENDING,
  LOAD_APPLICATIONS_FULFILLED,
  CREATE_APPLICATION,
  DUPLICATE_APPLICATION,
  UPDATE_APPLICATION,
  DELETE_APPLICATION,
  LOAD_APPLICATION_PENDING,
  LOAD_APPLICATION_FULFILLED
} from "../types/application";

export type State = ImmutableMap<{
  applicationList: ApplicationList;
  applications: Immutable.OrderedMap<string, Application>;
  applicationPodNames: Immutable.Map<string, Immutable.List<string>>;
  isListLoading: boolean;
  isListFirstLoaded: boolean;
  isItemLoading: boolean;
}>;

const initialState: State = Immutable.Map({
  applicationList: Immutable.List(),
  applications: Immutable.OrderedMap({}),
  applicationPodNames: Immutable.Map({}),
  isListLoading: false,
  isListFirstLoaded: false,
  isItemLoading: false
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_APPLICATIONS_PENDING: {
      state = state.set("isListLoading", true);
      break;
    }
    case LOAD_APPLICATIONS_FULFILLED: {
      state = state.set("isListFirstLoaded", true).set("isListLoading", false);
      state = state.set("applicationList", action.payload.applicationList);
      break;
    }
    case LOAD_APPLICATION_PENDING: {
      state = state.set("isItemLoading", true);
      break;
    }
    case LOAD_APPLICATION_FULFILLED: {
      state = state.set("isItemLoading", false);
      const applications = state.get("applications");

      let application = action.payload.application;

      state = state.set("applications", applications.set(application.get("name"), application));
      state = state.setIn(["applicationPodNames", application.get("name")], action.payload.podNames);
      break;
    }
    case CREATE_APPLICATION: {
      const applications = state.get("applications");

      let application = action.payload.application;

      state = state.set("applications", applications.set(application.get("name"), application));
      break;
    }
    case DUPLICATE_APPLICATION: {
      const applications = state.get("applications");

      let application = action.payload.application;

      state = state.set("applications", applications.set(application.get("name"), application));
      break;
    }
    case UPDATE_APPLICATION: {
      const applications = state.get("applications");

      let application = action.payload.application;

      state = state.set("applications", applications.set(application.get("name"), application));
      break;
    }
    case DELETE_APPLICATION: {
      state = state.deleteIn(["applications", action.payload.applicationName]);

      let applicationList = state.get("applicationList");
      applicationList = applicationList.filter(item => item.get("name") !== action.payload.applicationName);

      state = state.set("applicationList", applicationList);
      break;
    }
  }

  return state;
};

export default reducer;
