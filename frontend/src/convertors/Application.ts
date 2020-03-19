import { List, Map } from "immutable";
import { V1alpha1Application } from "../kappModel/v1alpha1Application";
import { ObjectSerializer } from "../model/models";
import { convertFromCRDApplicationComponent, convertToCRDApplicationComponent } from "./ApplicationComponent";
import { ApplicationComponent, Application } from "../types/application";

export const convertFromCRDApplication = (c: V1alpha1Application): Application => {
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

  const res: Application = Map({
    id: metadata.name!,
    isActive: c.status?.isActive,
    name: metadata.name!,
    namespace: metadata.namespace,
    sharedEnv: List(sharedEnv),
    components: components,
    status: Map({}),
    resourceVersion: metadata.resourceVersion
  });

  return res;
};

export const convertToCRDApplication = (c: Application): V1alpha1Application => {
  return ObjectSerializer.deserialize(
    {
      apiVersion: "core.kapp.dev/v1alpha1",
      kind: "Application",
      metadata: {
        name: c.get("name"),
        namespace: c.get("namespace"),
        resourceVersion: c.get("resourceVersion")
      },
      spec: {
        sharedEnv: c
          .get("sharedEnvs")
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
