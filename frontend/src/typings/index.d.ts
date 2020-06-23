import { Map } from "immutable";

export interface ImmutableMap<T> extends Map<string, any> {
  get<K extends Extract<keyof T, string>>(key: K, notSetValue?: any): T[K];

  set<K extends Extract<keyof T, string>>(key: K, value: any): this;

  delete<K extends Extract<keyof T, string>>(key: K): this;
}

