export class V1AlphaComponentEnvVar {
  "name": string;
  "value"?: string;
  "sharedEnv"?: string;
  "prefix"?: string;
  "suffix"?: string;
  "componentPort"?: string;

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
      name: "sharedEnv",
      baseName: "sharedEnv",
      type: "string"
    },
    {
      name: "prefix",
      baseName: "prefix",
      type: "string"
    },
    {
      name: "suffix",
      baseName: "suffix",
      type: "string"
    },
    {
      name: "componentPort",
      baseName: "componentPort",
      type: "string"
    }
  ];

  static getAttributeTypeMap() {
    return V1AlphaComponentEnvVar.attributeTypeMap;
  }
}
