import React from "react";
import { ConfirmDialog, ConfirmDialogProps } from "../ConfirmDialog";
import { TextField, TextFieldProps } from "@material-ui/core";

interface Props extends Omit<ConfirmDialogProps, "onAgree"> {
  textFieldProps?: TextFieldProps;
  onAgree: (value: string) => any;
}

export interface DuplicateDialogHostState {
  isDuplicateDialogShow: boolean;
  duplicatingItemId: string;
}

export const defaultDuplicateDialogHostStateValue: DuplicateDialogHostState = {
  isDuplicateDialogShow: false,
  duplicatingItemId: ""
};

export function DuplicateDialog(props: Props) {
  const [value, setValue] = React.useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const resetValue = () => setValue("");

  const content = (
    <>
      {props.content}
      <TextField
        autoFocus
        margin="dense"
        label="value"
        type="text"
        value={value}
        onChange={handleChange}
        fullWidth
        {...props.textFieldProps}
      />
    </>
  );

  const onAgree = () => {
    props.onAgree(value);
  };

  return (
    <ConfirmDialog
      {...props}
      content={content}
      onAgree={onAgree}
      onExited={resetValue}
    />
  );
}
