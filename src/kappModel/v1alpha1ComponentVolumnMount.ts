export class V1Alpha1ComponentVolumnMount {
  "mountPath": string;
  "name": string;

  static discriminator: string | undefined = undefined;

  static attributeTypeMap: Array<{
    name: string;
    baseName: string;
    type: string;
  }> = [
    {
      name: "mountPath",
      baseName: "mountPath",
      type: "string"
    },
    {
      name: "name",
      baseName: "name",
      type: "string"
    }
  ];

  static getAttributeTypeMap() {
    return V1Alpha1ComponentVolumnMount.attributeTypeMap;
  }
}
