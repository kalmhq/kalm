import { ImmutableMap } from "typings";
import Immutable from "immutable";

type NamedResource = ImmutableMap<{ name: string }>;

export const removeInListByName = <T extends NamedResource>(
  list: Immutable.List<T>,
  name: string,
): Immutable.List<T> => {
  const index = list.findIndex((x) => x.get("name") === name);

  if (index < 0) {
    return list;
  }

  return list.delete(index);
};

export const removeInList = <T extends NamedResource>(list: Immutable.List<T>, data: T): Immutable.List<T> => {
  const index = list.findIndex((x) => x.get("name") === data.get("name"));

  if (index < 0) {
    return list;
  }

  return list.delete(index);
};

export const addOrUpdateInList = <T extends NamedResource>(list: Immutable.List<T>, data: T): Immutable.List<T> => {
  const index = list.findIndex((x) => x.get("name") === data.get("name"));

  if (index < 0) {
    return list.push(data);
  }

  return list.set(index, data);
};
