import { Map } from "immutable";
import { V1alpha1Dependency } from "../kappModel/v1alpha1Dependency";
import { ObjectSerializer } from "../model/models";
import { KappDependency, KappDependencyStatus, KappDependencyStatusText } from "../types";

// name: string;
// version: string;
// imageLink: string;
// description: string;
// provider: string;
// status: KappDependencyStatus;
// statusText?: string;
// projectHomepageLink: string;

const getStatus = (statusText: string): KappDependencyStatus => {
  const index = KappDependencyStatusText.indexOf(statusText);

  if (index !== -1) {
    return index as KappDependencyStatus;
  }

  return KappDependencyStatus.NotInstalled;
};

export const convertFromCRDDependency = (c: V1alpha1Dependency): KappDependency => {
  const spec = c.spec!;
  const metadata = c.metadata!;

  const res: KappDependency = Map({
    name: metadata.name!,
    type: spec.type,
    version: spec.version,
    imageLink: "",
    description: "",
    provider: "official",
    status: getStatus(c.status!.status),
    statusText: "",
    projectHomepageLink: ""

    // plugins: List([Map({ name: "ingress", enableHttp: true, paths: ["3"], hosts: ["123"] })])
  });

  return res;
};

export const convertToCRDDependency = (c: KappDependency): V1alpha1Dependency => {
  return ObjectSerializer.deserialize(
    {
      apiVersion: "core.kapp.dev/v1alpha1",
      kind: "Dependency",
      metadata: {
        name: c.get("name")
      },
      spec: {}
    },
    "V1alpha1Dependency"
  );
};
