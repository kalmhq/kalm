import { Map, List } from "immutable";
import { ObjectSerializer } from "../model/models";
import { V1alpha1ComponentTemplateSpec } from "../kappModel/v1alpha1ComponentTemplateSpec";
import { ComponentTemplate, workloadTypeServer } from "../types/componentTemplate";

export const convertFromCRDComponentTemplateSpec = (c: V1alpha1ComponentTemplateSpec): ComponentTemplate => {
  const env = c.env
    ? List(
        c.env.map(x =>
          Map({
            name: x.name,
            type: x.type,
            value: x.value
          })
        )
      )
    : List([]);

  const ports = c.ports
    ? List(
        c.ports.map(x =>
          Map({
            name: x.name,
            protocol: x.protocol,
            containerPort: x.containerPort,
            servicePort: x.servicePort
          })
        )
      )
    : List([]);

  const res: ComponentTemplate = Map({
    name: c.name,
    image: c.image,
    env: env,
    ports: ports,
    command: c.command,
    cpu: c.cpu || "",
    memory: c.memory || "",
    disks: List([]),
    workloadType: c.workloadType || workloadTypeServer,
    schedule: c.schedule,
    restartStrategy: "rollingUpdate",
    terminationGracePeriodSeconds: 30,
    dnsPolicy: "ClusterFirst",
    plugins: List()
  });

  return res;
};

export const convertToCRDComponentTemplateSpec = (c: ComponentTemplate): V1alpha1ComponentTemplateSpec => {
  return ObjectSerializer.deserialize(
    {
      name: c.get("name"),
      image: c.get("image"),
      command: c.get("command").toArray(),
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
      ports: c.get("ports")
        ? c
            .get("ports")!
            .map(x => ({
              name: x.get("name"),
              protocol: x.get("protocol"),
              containerPort: x.get("containerPort"),
              servicePort: x.get("servicePort")
            }))
            .toArray()
        : [],
      cpu: c.get("cpu"),
      memory: c.get("memory"),
      workloadType: c.get("workloadType") || workloadTypeServer,
      schedule: c.get("schedule")
    },
    "V1alpha1ComponentTemplateSpec"
  );
};

// export const convertFromCRDComponentTemplate = (c: V1alpha1ComponentTemplate): ComponentTemplate => {
//   const spec = c.spec!;
//   const metadata = c.metadata!;

//   const env = spec.env
//     ? List(
//         spec.env.map(x =>
//           Map({
//             name: x.name,
//             type: x.type,
//             value: x.value
//           })
//         )
//       )
//     : List([]);

//   const ports = spec.ports
//     ? List(
//         spec.ports.map(x =>
//           Map({
//             name: x.name,
//             protocol: x.protocol,
//             containerPort: x.containerPort,
//             servicePort: x.servicePort
//           })
//         )
//       )
//     : List([]);

//   const res: ComponentTemplate = Map({
//     id: metadata.name!,
//     name: metadata.name!,
//     image: spec.image,
//     env: env,
//     ports: ports,
//     command: spec.command,
//     cpu: spec.cpu || "",
//     memory: spec.memory || "",
//     disks: List([]),
//     resourceVersion: metadata.resourceVersion,
//     workloadType: spec.workloadType || workloadTypeServer,
//     schedule: spec.schedule,
//     restartStrategy: "rollingUpdate",
//     terminationGracePeriodSeconds: 30,
//     dnsPolicy: "ClusterFirst",
//     plugins: List()
//     // plugins: List([Map({ name: "ingress", enableHttp: true, paths: ["3"], hosts: ["123"] })])
//   });

//   return res;
// };

// export const convertToCRDComponentTemplate = (c: ComponentTemplate): V1alpha1ComponentTemplate => {
//   return ObjectSerializer.deserialize(
//     {
//       apiVersion: "core.kapp.dev/v1alpha1",
//       kind: "ComponentTemplate",
//       metadata: {
//         name: c.get("name"),
//         resourceVersion: c.get("resourceVersion")
//       },
//       spec: {
//         name: c.get("name"),
//         image: c.get("image"),
//         command: c.get("command"),
//         env: c.get("env")
//           ? c
//               .get("env")!
//               .map(x => ({
//                 name: x.get("name"),
//                 type: x.get("type"),
//                 value: x.get("value")
//               }))
//               .toArray()
//           : [],
//         ports: c.get("ports")
//           ? c
//               .get("ports")!
//               .map(x => ({
//                 name: x.get("name"),
//                 protocol: x.get("protocol"),
//                 containerPort: x.get("containerPort"),
//                 servicePort: x.get("servicePort")
//               }))
//               .toArray()
//           : [],
//         cpu: c.get("cpu"),
//         memory: c.get("memory"),
//         workloadType: c.get("workloadType") || workloadTypeServer,
//         schedule: c.get("schedule")
//       }
//     },
//     "V1alpha1ComponentTemplate"
//   );
// };
