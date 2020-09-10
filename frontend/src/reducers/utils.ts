import { original } from "immer";

// following are only used in reducer immer draft state;
interface NameResource {
  name: string;
}

export const addOrUpdateInArray = <T extends NameResource>(
  arr: Array<T>,
  data: T,
  updateExisted: boolean = true,
): Array<T> => {
  // find should in original instead of draft for performance
  const index = original(arr)!.findIndex((x) => x.name === data.name);

  if (index < 0) {
    arr.push(data);
    return arr;
  }

  if (!updateExisted) {
    return arr;
  }

  arr[index] = data;

  return arr;
};

export const removeInArrayByName = <T extends NameResource>(arr: Array<T>, name: string): Array<T> => {
  const index = original(arr)!.findIndex((x) => x.name === name);

  if (index < 0) {
    return arr;
  }

  arr.splice(index, 1);
  return arr;
};

export const removeInArray = <T extends NameResource>(arr: Array<T>, data: T): Array<T> => {
  const index = original(arr)!.findIndex((x) => x.name === data.name);

  if (index < 0) {
    return arr;
  }

  arr.splice(index, 1);
  return arr;
};

export const isInArray = <T extends NameResource>(arr: Array<T>, data: T): boolean => {
  const index = original(arr)!.findIndex((x) => x.name === data.name);

  if (index < 0) {
    return false;
  }

  return true;
};
