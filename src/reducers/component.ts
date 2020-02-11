import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import {
  CREATE_COMPONENT_ACTION,
  ComponentFormValues,
  UPDATE_COMPONENT_ACTION,
  DELETE_COMPONENT_ACTION
} from "../actions";
import { Actions } from "../actions";

export type State = ImmutableMap<{
  components: Immutable.OrderedMap<string, ComponentFormValues>;
}>;

const initialState: State = Immutable.Map({
  components: Immutable.OrderedMap<ComponentFormValues>({
    "0": Immutable.Map({
      id: "0",
      name: "test",
      image: "test.com/test:latest",
      command: "/bin/runapp",
      env: Immutable.List([
        Immutable.Map({
          name: "static-name",
          type: "static",
          value: "foo-value"
        }),
        Immutable.Map({ type: "external", value: "", name: "external" })
      ]),
      ports: Immutable.List([
        Immutable.Map({
          name: "http",
          protocol: "TCP",
          containerPort: 8080,
          servicePort: 80
        })
      ]),
      cpu: 2600,
      memory: 2000,
      disk: Immutable.List([
        Immutable.Map({
          name: "test",
          type: "new",
          path: "123",
          existDisk: "",
          size: "300",
          storageClass: "external"
        }),
        Immutable.Map({
          name: "",
          type: "existing",
          path: "23123",
          existDisk: "1",
          size: "",
          storageClass: ""
        })
      ])
    }),
    "1": Immutable.Map({
      id: "1",
      name: "ddex",
      image: "ddex.com/ddex:laddex",
      command: "/bin/runapp",
      env: Immutable.List([
        Immutable.Map({
          name: "static-name",
          type: "static",
          value: "foo-value"
        }),
        Immutable.Map({ type: "external", value: "", name: "external" })
      ]),
      ports: Immutable.List([
        Immutable.Map({
          name: "http",
          protocol: "TCP",
          containerPort: 8080,
          servicePort: 80
        })
      ]),
      cpu: 2600,
      memory: 2000,
      disk: Immutable.List([
        Immutable.Map({
          name: "ddex",
          type: "new",
          path: "123",
          existDisk: "",
          size: "300",
          storageClass: "external"
        }),
        Immutable.Map({
          name: "",
          type: "existing",
          path: "23123",
          existDisk: "1",
          size: "",
          storageClass: ""
        })
      ])
    })
  })
});

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case CREATE_COMPONENT_ACTION: {
      const components = state.get("components");
      const tmpId = components.size.toString(); // TODO fake id
      let componentValues = action.payload.componentValues;
      componentValues = componentValues.set("id", tmpId);
      state = state.set(
        "components",
        components.set(
          tmpId, // TODO fake id
          componentValues
        )
      );
      break;
    }
    case UPDATE_COMPONENT_ACTION: {
      const components = state.get("components");
      const id = action.payload.componentId;
      let componentValues = action.payload.componentValues;
      componentValues = componentValues.set("id", id);
      state = state.set("components", components.set(id, componentValues));
      break;
    }
    case DELETE_COMPONENT_ACTION: {
      state = state.deleteIn(["components", action.payload.componentId]);
      break;
    }
  }

  return state;
};

export default reducer;
