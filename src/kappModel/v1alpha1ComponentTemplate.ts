import { V1ObjectMeta } from "../model/v1ObjectMeta";
import { V1Alpha1ComponentTemplateSpec } from "./v1alpha1ComponentTemplateSpec";

export class V1Alpha1ComponentTemplate {
  "apiVersion"?: string;
  "kind"?: string;
  "metadata"?: V1ObjectMeta;
  "spec"?: V1Alpha1ComponentTemplateSpec;

  static discriminator: string | undefined = undefined;

  static attributeTypeMap: Array<{
    name: string;
    baseName: string;
    type: string;
  }> = [
    {
      name: "apiVersion",
      baseName: "apiVersion",
      type: "string"
    },
    {
      name: "kind",
      baseName: "kind",
      type: "string"
    },
    {
      name: "metadata",
      baseName: "metadata",
      type: "V1ObjectMeta"
    },
    {
      name: "spec",
      baseName: "spec",
      type: "V1Alpha1ComponentTemplateSpec"
    }
  ];

  static getAttributeTypeMap() {
    return V1Alpha1ComponentTemplate.attributeTypeMap;
  }
}
