import { V1Alpha1ComponentTemplateEnvVar } from "./v1alpha1ComponentTemplateEnvVar";
import { V1Alpha1ComponentTemplatePort } from "./v1alpha1ComponentTemplatePort";
import { V1Alpha1ComponentTemplateVolumnMount } from "./v1alpha1ComponentTemplateVolumnMount";
import { V1ResourceRule } from "../model/models";

export class V1Alpha1ComponentTemplateSpec {
  "afterStart"?: Array<string>;
  "beforeDestroy"?: Array<string>;
  "beforeStart"?: Array<string>;
  "env"?: Array<V1Alpha1ComponentTemplateEnvVar>;
  "image": string;
  "name": string;
  "ports"?: Array<V1Alpha1ComponentTemplatePort>;
  "cpu"?: string;
  "memory"?: string;
  "command"?: Array<string>;
  "volumeMounts"?: Array<V1Alpha1ComponentTemplateVolumnMount>;

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
      type: "Array<V1Alpha1ComponentTemplateEnvVar>"
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
      type: "Array<V1Alpha1ComponentTemplatePort>"
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
      type: "Array<V1Alpha1ComponentTemplateVolumnMount>"
    }
  ];

  static getAttributeTypeMap() {
    return V1Alpha1ComponentTemplateSpec.attributeTypeMap;
  }
}
