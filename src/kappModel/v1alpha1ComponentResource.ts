export class V1Alpha1ComponentResource {
  "cpu"?: { min: string; max: string };
  "memory"?: { min: string; max: string };

  static discriminator: string | undefined = undefined;

  static attributeTypeMap: Array<{
    name: string;
    baseName: string;
    type: string;
  }> = [
    {
      name: "cpu",
      baseName: "cpu",
      type: "{ min: string; max: string }"
    },
    {
      name: "memory",
      baseName: "memory",
      type: "{ min: string; max: string }"
    }
  ];

  static getAttributeTypeMap() {
    return V1Alpha1ComponentResource.attributeTypeMap;
  }
}
