export class V1Alpha1ComponentTemplateEnvVar {
  "name": string;
  "type": string;
  "value"?: string;

  static discriminator: string | undefined = undefined;

  static attributeTypeMap: Array<{
    name: string;
    baseName: string;
    type: string;
  }> = [
    {
      name: "name",
      baseName: "name",
      type: "string"
    },
    {
      name: "value",
      baseName: "value",
      type: "string"
    },
    {
      name: "type",
      baseName: "type",
      type: "string"
    }
  ];

  static getAttributeTypeMap() {
    return V1Alpha1ComponentTemplateEnvVar.attributeTypeMap;
  }
}
