import { Map } from "immutable";

export interface ImmutableMap<T> extends Map<string, any> {
  get<K extends Extract<keyof T, string>>(key: K, notSetValue?: any): T[K];
  // update<K extends Extract<keyof T, string>>(key: K, notSetValue?: any): this;
  set<K extends Extract<keyof T, string>>(key: K, value: any): this;
  delete<K extends Extract<keyof T, string>>(key: K): this;

  update<K extends Extract<keyof T, string>, V extends T[K]>(key: K, notSetValue: V, updater: (value: V) => V): this;
  update<K extends Extract<keyof T, string>, V extends T[K]>(key: K, updater: (value: V) => V): this;
}
