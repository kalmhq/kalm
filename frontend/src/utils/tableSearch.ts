import { isImmutable } from "immutable";
import { Column } from "material-table";

export const customSearchForImmutable = <RowDataType extends { get: any }>(
  filter: string,
  rowData: RowDataType,
  columnDef: Column<RowDataType>,
): boolean => {
  // according to https://github.com/mbrn/material-table/blob/ac369e3ce292152a84732af8dfd31badce1e40d6/src/utils/data-manager.js#L624
  if (columnDef.field && rowData.get) {
    const fieldValue = rowData.get(columnDef.field as any);
    if (typeof fieldValue === "string" || typeof fieldValue === "number" || typeof fieldValue === "boolean") {
      return `${fieldValue}`.toUpperCase().includes(filter.toUpperCase());
    } else if (isImmutable(fieldValue)) {
      return JSON.stringify(fieldValue.toJS()).toUpperCase().includes(filter.toUpperCase());
    }
  }
  return false;
};
