import { EventOrValueHandler } from "redux-form";
import { ChangeEvent } from "react";
import { store } from "store";
import { setDebouncing } from "actions/debounce";

export const inputOnChangeWithDebounce = (
  nativeOnChange: EventOrValueHandler<ChangeEvent<any>>,
  value: any,
  formID: string,
  name: string,
) => {
  nativeOnChange(value);
  store.dispatch(setDebouncing(formID, name));
};
