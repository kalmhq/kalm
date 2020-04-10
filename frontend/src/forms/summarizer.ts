import { Map, List } from "immutable";

export const extractSummaryInfoFromMap = (fieldValue: Map<string, any>): any => {
  return fieldValue.map((value: any, key: string) => {
    if (typeof value === "string" || typeof value === "number") {
      return value;
    } else if (Map.isMap(value)) {
      return value.map((v: any, key: string) => {
        if (Map.isMap(v)) {
          const subKeys = v.keySeq().toArray();
          return v
            .toList()
            .map((subV: string, index: number) => {
              return subKeys[index] + ": value :" + subV;
            })
            .join(",");
        } else if (List.isList(v)) {
          return v.join && v.join(",");
        } else {
          return v;
        }
      });
    } else {
      console.log("other type value", value.toJS());
    }
    return value;
  });
};

export const extractSummaryInfoFromList = (feildValue: List<any>): any => {
  return feildValue.map((item: any) => {
    if (Map.isMap(item)) {
      const keys = item.keySeq().toArray();
      return item
        .toList()
        .map((subV: string, index: number) => {
          return keys[index] + ":" + subV;
        })
        .join("\t");
    }
    return item.join(",");
  });
};
