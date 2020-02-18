import { V1Alpha1Component } from "../kappModel/v1alpha1Component";
import { Component } from "../actions";
import { Map, List } from "immutable";
import { ObjectSerializer } from "../model/models";

export const convertFromCRDComponentTemplate = (
  c: V1Alpha1Component
): Component => {
  console.log(c);
  const spec = c.spec!;
  const metadata = c.metadata!;

  const env = spec.env
    ? List(
        spec.env.map(x =>
          Map({
            name: x.name,
            type: x.type,
            value: x.value
          })
        )
      )
    : List([]);

  const ports = spec.ports
    ? List(
        spec.ports.map(x =>
          Map({
            name: x.name,
            protocol: x.protocol,
            containerPort: x.containerPort,
            servicePort: x.servicePort
          })
        )
      )
    : List([]);

  const res: Component = Map({
    id: metadata.name!,
    name: metadata.name!,
    image: spec.image,
    env: env,
    ports: ports,
    command: spec.command ? spec.command.join(" ") : "",
    cpu: spec.cpu || "",
    memory: spec.memory || "",
    disk: List([]),
    resourceVersion: metadata.resourceVersion
  });

  return res;
};

export const convertToCRDComponentTemplate = (
  c: Component
): V1Alpha1Component => {
  return ObjectSerializer.deserialize(
    {
      apiVersion: "core.kapp.dev/v1alpha1",
      kind: "ComponentTemplate",
      metadata: {
        name: c.get("name"),
        resourceVersion: c.get("resourceVersion")
      },
      spec: {
        name: c.get("name"),
        image: c.get("image"),
        command: [c.get("command")],
        env: c
          .get("env")
          .map(x => ({
            name: x.get("name"),
            type: x.get("type"),
            value: x.get("value")
          }))
          .toArray(),
        ports: c
          .get("ports")
          .map(x => ({
            name: x.get("name"),
            protocol: x.get("protocol"),
            containerPort: x.get("containerPort"),
            servicePort: x.get("servicePort")
          }))
          .toArray(),
        cpu: c.get("cpu"),
        memory: c.get("memory")
      }
    },
    "V1Alpha1Component"
  );
};
