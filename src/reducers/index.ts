import { combineReducers } from "redux-immutable";
import { reducer as formReducer } from "redux-form/immutable";
import { FormState } from "redux-form";
import test from "./test";
import components, { State as ComponentState } from "./component";
import configs, { State as ConfigState } from "./config";
import { connectRouter, RouterState } from "connected-react-router/immutable";
import { History, LocationState } from "history";
import { ImmutableMap } from "../typings";

export type RootState = ImmutableMap<{
  components: ComponentState;
  configs: ConfigState;
  router: RouterState<LocationState>;
  form: FormState;
}>;

export default (history: History<LocationState>) =>
  combineReducers({
    form: formReducer,
    router: connectRouter(history),
    components,
    configs,
    test
  });
