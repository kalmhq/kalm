import { combineReducers } from "redux";
import { reducer as formReducer, FormState } from "redux-form";
import test from "./test";
import components, { State as ComponentState } from "./component";
import { connectRouter, RouterState } from "connected-react-router";
import { History, LocationState } from "history";

export interface RootState {
  components: ComponentState;
  router: RouterState<LocationState>;
  form: FormState;
}

export default (history: History<LocationState>) =>
  combineReducers({
    form: formReducer,
    router: connectRouter(history),
    components,
    test
  });
