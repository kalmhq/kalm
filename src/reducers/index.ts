import { combineReducers } from "redux";
import { reducer as formReducer, FormState } from "redux-form";
import test from "./test";
import components, { State as ComponentState } from "./component";
import configs, { State as ConfigState } from "./config";
import { connectRouter, RouterState } from "connected-react-router";
import { History, LocationState } from "history";

export interface RootState {
  components: ComponentState;
  configs: ConfigState;
  router: RouterState<LocationState>;
  form: FormState;
}

export default (history: History<LocationState>) =>
  combineReducers({
    form: formReducer,
    router: connectRouter(history),
    components,
    configs,
    test
  });
