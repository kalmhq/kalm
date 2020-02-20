import { List, Map } from "immutable";
import { ApplicationComponent, ApplicationNew } from "../actions";
import { V1alpha1Application } from "../kappModel/v1alpha1Application";
import { ObjectSerializer } from "../model/models";
import {
  convertFromCRDApplicationComponent,
  convertToCRDApplicationComponent
} from "./ApplicationComponent";

export const convertFromCRDApplication = (
  c: V1alpha1Application
): ApplicationNew => {
  const spec = c.spec!;
  const metadata = c.metadata!;

  const sharedEnv = spec.sharedEnv
    ? List(
        spec.sharedEnv.map(x =>
          Map({
            name: x.name,
            value: x.value
          })
        )
      )
    : List([]);

  const components: List<ApplicationComponent> = spec.components
    ? List(spec.components.map(convertFromCRDApplicationComponent))
    : List();

  const res: ApplicationNew = Map({
    id: metadata.name!,
    name: metadata.name!,
    isEnabled: false,
    sharedEnv: List(sharedEnv),
    components: components,
    status: Map({})
  });

  return res;
};

export const convertToCRDApplication = (
  c: ApplicationNew
): V1alpha1Application => {
  return ObjectSerializer.deserialize(
    {
      apiVersion: "core.kapp.dev/v1alpha1",
      kind: "Application",
      metadata: {
        name: c.get("name"),
        resourceVersion: c.get("resourceVersion")
      },
      spec: {
        sharedEnv: c
          .get("sharedEnv")
          .map(x => ({
            name: x.get("name"),
            value: x.get("value")
          }))
          .toArray(),
        components: c
          .get("components")
          .map(convertToCRDApplicationComponent)
          .toArray()
      }
    },
    "V1alpha1Application"
  );
};
