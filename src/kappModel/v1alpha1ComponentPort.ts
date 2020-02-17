export class V1Alpha1ComponentPort {
  "containerPort": number;
  "servicePort": number;
  "name"?: string;
  "protocol"?: string;

  static discriminator: string | undefined = undefined;

  static attributeTypeMap: Array<{
    name: string;
    baseName: string;
    type: string;
  }> = [
    {
      name: "containerPort",
      baseName: "containerPort",
      type: "number"
    },
    {
      name: "servicePort",
      baseName: "servicePort",
      type: "number"
    },
    {
      name: "name",
      baseName: "name",
      type: "string"
    },
    {
      name: "protocol",
      baseName: "protocol",
      type: "string"
    }
  ];

  static getAttributeTypeMap() {
    return V1Alpha1ComponentPort.attributeTypeMap;
  }
}
