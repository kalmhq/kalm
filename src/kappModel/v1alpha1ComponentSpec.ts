import { V1AlphaComponentEnvVar } from "./v1alpha1ComponentEnvVar";
import { V1Alpha1ComponentPort } from "./v1alpha1ComponentPort";
import { V1Alpha1ComponentResource } from "./v1alpha1ComponentResource";
import { V1Alpha1ComponentVolumnMount } from "./v1alpha1ComponentVolumnMount";

export class V1Alpha1ComponentSpec {
  "afterStart"?: Array<string>;
  "beforeDestroy"?: Array<string>;
  "beforeStart"?: Array<string>;
  "env"?: Array<V1AlphaComponentEnvVar>;
  "image": string;
  "name": string;
  "ports"?: Array<V1Alpha1ComponentPort>;
  "resources"?: V1Alpha1ComponentResource;
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
      type: "Array<V1AlphaComponentEnvVar>"
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
      name: "ports",
      baseName: "ports",
      type: "Array<V1Alpha1ComponentPort>"
    },
    {
      name: "resources",
      baseName: "resources",
      type: "V1Alpha1ComponentResource"
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
