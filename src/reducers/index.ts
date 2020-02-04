import { combineReducers } from "redux";
import { reducer as formReducer } from "redux-form";
import test from "./test";
import components, { State as ComponentState } from "./component";
import { connectRouter } from "connected-react-router";
import { History, LocationState } from "history";

export interface RootState {
  components: ComponentState;
}

export default (history: History<LocationState>) =>
  combineReducers({
    form: formReducer,
    router: connectRouter(history),
    components,
    test
  });
