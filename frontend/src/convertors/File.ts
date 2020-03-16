import { Map } from "immutable";
import { ConfigFile } from "../actions";
import { V1alpha1File } from "../kappModel/v1alpha1File";
import { ObjectSerializer } from "../model/models";

export const convertFromCRDFile = (c: V1alpha1File): ConfigFile => {
  const spec = c.spec!;
  const metadata = c.metadata!;

  const pathSlits = spec.path.split("/");

  const res: ConfigFile = Map({
    id: metadata.name!,
    name: pathSlits[pathSlits.length - 1],
    resourceVersion: metadata.resourceVersion,
    path: spec.path,
    content: spec.content
  });

  return res;
};

export const convertToCRDFile = (c: ConfigFile): V1alpha1File => {
  return ObjectSerializer.deserialize(
    {
      apiVersion: "core.kapp.dev/v1alpha1",
      kind: "File",
      metadata: {
        name: c.get("id"),
        resourceVersion: c.get("resourceVersion")
      },
      spec: {
        path: c.get("path"),
        content: c.get("content")
      }
    },
    "V1alpha1File"
  );
};
