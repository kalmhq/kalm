import { Button, makeStyles, OutlinedTextFieldProps, TextField } from "@material-ui/core";
import React from "react";
import { grey } from "@material-ui/core/colors";

export const Uploader = ({
  handleChange,
  touched,
  errorText,
  value,
  ...textFieldProps
}: {
  inputid: string;
  inputlabel: string;
  handleChange: any;
  touched?: boolean;
  value: any;
  errorText?: string;
  helperText?: string;
} & Partial<OutlinedTextFieldProps>) => {
  const onChange = (target: any) => {
    const file = target.files && target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
        if (evt.target) {
          handleChange(evt.target.result);
        }
      };
      reader.onerror = function (evt) {
        handleChange("error reading file");
      };
    }
  };

  const classes = makeStyles((theme) => ({
    inputLabel: {
      display: "flex",
      justifyContent: "space-between",
      background: grey[100],
      alignItems: "center",
      padding: "0 12px",
      fontWeight: 500,
    },
    textfield: {
      "& > div": {
        background: "#212121",
      },
    },
    fileInput: {
      color: "#fff",
    },
  }))();

  return (
    <div>
      <input
        id={textFieldProps.inputid}
        type="file"
        style={{ display: "none" }}
        onChange={(event: any) => onChange(event.target)}
      />
      <div className={classes.inputLabel}>
        <span>{textFieldProps.inputlabel}</span>
        <label htmlFor={textFieldProps.inputid}>
          <Button component="span" color="primary">
            Upload
          </Button>
        </label>
      </div>
      <TextField
        {...textFieldProps}
        className={classes.textfield}
        inputProps={{
          className: classes.fileInput,
        }}
        autoComplete="off"
        error={touched && !!errorText}
        helperText={(touched && errorText) || textFieldProps.helperText}
        fullWidth
        type="file"
        size="small"
        margin="dense"
        variant="outlined"
        onChange={(event) => handleChange(event.target.value)}
        value={value}
      />
    </div>
  );
};
