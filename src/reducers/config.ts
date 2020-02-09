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
      parentId: "",
      type: "folder",
      name: "Folder0",
      value: "config0"
    },
    "1": {
      id: "1",
      parentId: "",
      type: "folder",
      name: "Folder1",
      value: "config1"
    },
    "2": {
      id: "2",
      parentId: "",
      type: "file",
      name: "File2",
      value: "config2"
    },
    "3": {
      id: "1",
      parentId: "",
      type: "file",
      name: "File3",
      value: "config3"
    },
    "4": {
      id: "4",
      parentId: "0",
      type: "folder",
      name: "Folder4",
      value: "config4"
    },
    "5": {
      id: "5",
      parentId: "1",
      type: "folder",
      name: "Folder5",
      value: "config5"
    },
    "6": {
      id: "6",
      parentId: "0",
      type: "file",
      name: "File6",
      value: "config6"
    },
    "7": {
      id: "7",
      parentId: "1",
      type: "file",
      name: "File7",
      value: "config7"
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
