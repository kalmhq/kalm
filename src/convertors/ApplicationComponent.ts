import { List, Map } from "immutable";
import { ApplicationComponent, workloadTypeServer, EnvTypeStatic, portTypeTCP } from "../actions";
import { V1alpha1ApplicationSpecComponents } from "../kappModel/v1alpha1ApplicationSpecComponents";
import { ObjectSerializer } from "../model/models";

export const convertFromCRDApplicationComponent = (x: V1alpha1ApplicationSpecComponents): ApplicationComponent => {
  const res: ApplicationComponent = Map({
    name: x.name,
    image: x.image,
    command: x.command ? x.command[0] : "",
    workloadType: x.workloadType || workloadTypeServer,
    schedule: x.schedule,
    env: x.env ? List(x.env.map(e => Map({ name: e.name, value: e.value, type: e.type || EnvTypeStatic }))) : List([]),
    ports: List(
      x.ports
        ? x.ports.map(p =>
            Map({
              name: p.name,
              containerPort: p.containerPort,
              servicePort: p.servicePort,
              protocol: p.protocol || portTypeTCP
            })
          )
        : []
    ),
    cpu: x.cpu,
    memory: x.memory,
    disks: List([])
  });

  return res;
};

export const convertToCRDApplicationComponent = (c: ApplicationComponent): V1alpha1ApplicationSpecComponents => {
  return ObjectSerializer.deserialize(
    {
      name: c.get("name"),
      image: c.get("image"),
      cpu: c.get("cpu"),
      memory: c.get("memory"),
      workloadType: c.get("workloadType"),
      schedule: c.get("schedule"),
      env: c
        .get("env")
        .map(x => ({
          name: x.get("name"),
          type: x.get("type"),
          value: x.get("value")
        }))
        .toArray(),
      command: c.get("command") ? [c.get("command")] : []
    },
    "V1alpha1ApplicationSpecComponents"
  );
};
