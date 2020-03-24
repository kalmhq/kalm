import { List, Map } from "immutable";
import { V1alpha1ApplicationSpecComponents } from "../kappModel/v1alpha1ApplicationSpecComponents";
import { ObjectSerializer } from "../model/models";
import { ApplicationComponent } from "../types/application";
import { workloadTypeServer } from "../types/componentTemplate";
import { EnvTypeStatic, portTypeTCP } from "../types/common";

export const convertFromCRDApplicationComponent = (x: V1alpha1ApplicationSpecComponents): ApplicationComponent => {
  const res: ApplicationComponent = Map({
    name: x.name,
    image: x.image,
    command: x.command ? x.command[0] : [],
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
    disks: List([]),
    restartStrategy: "rollingUpdate",
    terminationGracePeriodSeconds: 30,
    dnsPolicy: "ClusterFirst",
    plugins: List(
      x.plugins
        ? x.plugins
            .filter((plugin: any) => plugin.type === "plugins.core.kapp.dev/v1alpha1.ingress")
            .map((plugin: any) =>
              Map({
                name: "ingress",
                type: plugin.type,
                enableHttps: !!plugin.enableHttps,
                enableHttp: !!plugin.enableHttp,
                autoHttps: !!plugin.autoHttps,
                hosts: plugin.hosts,
                paths: plugin.path,
                stripPath: !!plugin.stripPath,
                preserveHost: !!plugin.preserveHost
              })
            )
        : []
    )
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
      env: c.get("env")
        ? c
            .get("env")!
            .map(x => ({
              name: x.get("name"),
              type: x.get("type"),
              value: x.get("value")
            }))
            .toArray()
        : [],
      plugins: c.get("plugins")
        ? c
            .get("plugins")!
            .filter(x => x.get("type") === "plugins.core.kapp.dev/v1alpha1.ingress")
            .map(x => ({
              name: x.get("name"),
              type: x.get("type"),
              enableHttps: x.get("enableHttps"),
              enableHttp: x.get("enableHttp"),
              autoHttps: x.get("autoHttps"),
              hosts: x.get("hosts"),
              path: x.get("paths"),
              stripPath: x.get("stripPath"),
              preserveHost: x.get("preserveHost")
            }))
            .toArray()
        : [],
      command: c.get("command") ? [c.get("command")] : []
    },
    "V1alpha1ApplicationSpecComponents"
  );
};
