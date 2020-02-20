import { List, Map } from "immutable";
import { ApplicationComponent } from "../actions";
import { V1alpha1ApplicationSpecComponents } from "../kappModel/v1alpha1ApplicationSpecComponents";
import { ObjectSerializer } from "../model/models";

export const convertFromCRDApplicationComponent = (
  x: V1alpha1ApplicationSpecComponents
): ApplicationComponent => {
  const res: ApplicationComponent = Map({
    name: x.name,
    image: x.image,
    command: x.command ? x.command[0] : "",
    workloadType: x.workloadType,
    schedule: x.schedule,
    env: x.env
      ? List(
          x.env.map(e => Map({ name: e.name, value: e.value, type: e.type }))
        )
      : List([]),
    ports: List(
      x.ports
        ? x.ports.map(p =>
            Map({
              name: p.name,
              containerPort: p.containerPort,
              servicePort: p.servicePort,
              protocol: p.protocol
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

export const convertToCRDApplicationComponent = (
  c: ApplicationComponent
): V1alpha1ApplicationSpecComponents => {
  return ObjectSerializer.deserialize({}, "V1alpha1ApplicationSpecComponents");
};
