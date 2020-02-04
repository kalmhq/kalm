import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import {
  CREATE_COMPONENT_ACTION,
  ComponentFormValues,
  UPDATE_COMPONENT_ACTION
} from "../actions";
import { Actions } from "../actions";

export type State = ImmutableMap<{
  components: Immutable.OrderedMap<string, ComponentFormValues>;
}>;

const initialState: State = Immutable.Map({
  components: Immutable.OrderedMap({
    "0": {
      id: "0",
      name: "test",
      image: "test.com/test:latest",
      command: "/bin/runapp",
      env: [
        { name: "static-name", type: "static", value: "foo-value" },
        { type: "external", value: "", name: "external" }
      ],
      ports: [
        { name: "http", protocol: "TCP", containerPort: 8080, servicePort: 80 }
      ],
      cpu: 2600,
      memory: 2000,
      disk: [
        {
          name: "test",
          type: "new",
          path: "123",
          existDisk: "",
          size: "300",
          storageClass: "external"
        },
        {
          name: "",
          type: "existing",
          path: "23123",
          existDisk: "1",
          size: "",
          storageClass: ""
        }
      ]
    },
    "1": {
      id: "1",
      name: "ddex",
      image: "ddex.com/ddex:laddex",
      command: "/bin/runapp",
      env: [
        { name: "static-name", type: "static", value: "foo-value" },
        { type: "external", value: "", name: "external" }
      ],
      ports: [
        { name: "http", protocol: "TCP", containerPort: 8080, servicePort: 80 }
      ],
      cpu: 2600,
      memory: 2000,
      disk: [
        {
          name: "ddex",
          type: "new",
          path: "123",
          existDisk: "",
          size: "300",
          storageClass: "external"
        },
        {
          name: "",
          type: "existing",
          path: "23123",
          existDisk: "1",
          size: "",
          storageClass: ""
        }
      ]
    }
  })
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case CREATE_COMPONENT_ACTION: {
      const components = state.get("components");
      const tmpId = components.size.toString(); // TODO fake id
      action.payload.componentValues.id = tmpId;
      state = state.set(
        "components",
        components.set(
          tmpId, // TODO fake id
          action.payload.componentValues
        )
      );
      break;
    }
    case UPDATE_COMPONENT_ACTION: {
      const components = state.get("components");
      const id = action.payload.componentId;
      action.payload.componentValues.id = id;
      state = state.set(
        "components",
        components.set(id, action.payload.componentValues)
      );
      break;
    }
  }

  return state;
};

export default reducer;
