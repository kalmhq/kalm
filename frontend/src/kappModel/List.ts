import { V1ListMeta } from "../model/models";

export interface ItemList<T> {
  apiVersion?: string;
  items: Array<T>;
  kind?: string;
  metadata?: V1ListMeta;
}
