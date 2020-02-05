import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import {
  CREATE_CONFIG_ACTION,
  ConfigFormValues,
  UPDATE_CONFIG_ACTION,
  DELETE_CONFIG_ACTION
} from "../actions";
import { Actions } from "../actions";

export type State = ImmutableMap<{
  configs: Immutable.OrderedMap<string, ConfigFormValues>;
}>;

const initialState: State = Immutable.Map({
  configs: Immutable.OrderedMap({
    "0": {
      id: "0",
      type: "folder",
      name: "Folder0",
      value: "config0"
    },
    "1": {
      id: "1",
      type: "folder",
      name: "Folder1",
      value: "config1"
    },
    "2": {
      id: "2",
      type: "file",
      name: "File2",
      value: "config2"
    },
    "3": {
      id: "1",
      type: "file",
      name: "File1",
      value: "config3"
    }
  })
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case CREATE_CONFIG_ACTION: {
      const configs = state.get("configs");
      const tmpId = configs.size.toString(); // TODO fake id
      state = state.set(
        "configs",
        configs.set(
          tmpId, // TODO fake id
          action.payload.config
        )
      );
      break;
    }
    case UPDATE_CONFIG_ACTION: {
      const configs = state.get("configs");
      const id = action.payload.configId;
      state = state.set("configs", configs.set(id, action.payload.config));
      break;
    }
    case DELETE_CONFIG_ACTION: {
      state = state.deleteIn(["configs", action.payload.configId]);
      break;
    }
  }

  return state;
};

export default reducer;
