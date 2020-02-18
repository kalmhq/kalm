import { V1Alpha1ComponentEnvVar } from "./v1alpha1ComponentEnvVar";
import { V1Alpha1ComponentPort } from "./v1alpha1ComponentPort";
import { V1Alpha1ComponentVolumnMount } from "./v1alpha1ComponentVolumnMount";
import { V1ResourceRule } from "../model/models";

export class V1Alpha1ComponentSpec {
  "afterStart"?: Array<string>;
  "beforeDestroy"?: Array<string>;
  "beforeStart"?: Array<string>;
  "env"?: Array<V1Alpha1ComponentEnvVar>;
  "image": string;
  "name": string;
  "ports"?: Array<V1Alpha1ComponentPort>;
  "cpu"?: string;
  "memory"?: string;
  "command"?: Array<string>;
  "volumeMounts"?: Array<V1Alpha1ComponentVolumnMount>;

  static discriminator: string | undefined = undefined;

  static attributeTypeMap: Array<{
    name: string;
    baseName: string;
    type: string;
  }> = [
    {
      name: "afterStart",
      baseName: "afterStart",
      type: "Array<string>"
    },
    {
      name: "beforeDestroy",
      baseName: "beforeDestroy",
      type: "Array<string>"
    },
    {
      name: "beforeStart",
      baseName: "beforeStart",
      type: "Array<string>"
    },
    {
      name: "env",
      baseName: "env",
      type: "Array<V1Alpha1ComponentEnvVar>"
    },
    {
      name: "image",
      baseName: "image",
      type: "string"
    },
    {
      name: "name",
      baseName: "name",
      type: "string"
    },
    {
      name: "command",
      baseName: "command",
      type: "Array<string>"
    },
    {
      name: "ports",
      baseName: "ports",
      type: "Array<V1Alpha1ComponentPort>"
    },
    {
      name: "cpu",
      baseName: "cpu",
      type: "string"
    },
    {
      name: "memory",
      baseName: "memory",
      type: "string"
    },
    {
      name: "volumeMounts",
      baseName: "volumeMounts",
      type: "Array<V1Alpha1ComponentVolumnMount>"
    }
  ];

  static getAttributeTypeMap() {
    return V1Alpha1ComponentSpec.attributeTypeMap;
  }
}
