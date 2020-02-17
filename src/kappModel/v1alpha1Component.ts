import { V1ObjectMeta } from "../model/v1ObjectMeta";
import { V1Alpha1ComponentSpec } from "./v1alpha1ComponentSpec";

export class V1Alpha1Component {
  "apiVersion"?: string;
  "kind"?: string;
  "metadata"?: V1ObjectMeta;
  "spec"?: V1Alpha1ComponentSpec;

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
      type: "V1Alpha1ComponentSpec"
    }
  ];

  static getAttributeTypeMap() {
    return V1Alpha1Component.attributeTypeMap;
  }
}
