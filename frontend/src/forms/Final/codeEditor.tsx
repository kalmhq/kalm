import { InputAdornment, OutlinedInputProps, FormControl, FormHelperText } from "@material-ui/core";
import React from "react";
import { FieldRenderProps } from "react-final-form";
import { RichEditor, RichEditorProps } from "widgets/RichEditor";

type FinalCodeEditorProps = RichEditorProps &
  FieldRenderProps<string | number | undefined, any> & {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
    htmlType?: string;
    showLineNumbers?: boolean;
  };

export const FinalCodeEditor = ({
  startAdornment,
  endAdornment,
  helperText,
  handleBlur,
  input: { value, onChange, onBlur },
  meta: { touched, error, submitError },
  htmlType,
  ...rest
}: FinalCodeEditorProps) => {
  const showError = touched && (!!error || !!submitError);

  const inputProps: Partial<OutlinedInputProps> = {};
  if (startAdornment) {
    inputProps.startAdornment = <InputAdornment position="start">{startAdornment}</InputAdornment>;
  }
  if (endAdornment) {
    inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
  }

  const onBlurCallback = React.useCallback(
    (e) => {
      handleBlur && handleBlur(e); // custom handleBlur eg. Ports close popupState
      onBlur(e);
    },
    [onBlur, handleBlur],
  );
  return (
    <FormControl
      fullWidth
      error={!!error}
      style={{ border: "1px solid #aaa", borderRadius: 4, paddingTop: 2, paddingBottom: 2 }}
    >
      {/* {title ? <FormLabel component="legend">{title}</FormLabel> : null} */}
      {showError && error ? <FormHelperText>{error}</FormHelperText> : null}
      <RichEditor
        {...rest}
        // type={htmlType}
        // fullWidth
        value={`${value}`}
        onChange={onChange}
        onBlur={onBlurCallback}
        placeholder={helperText}
        showLineNumbers={false}
        // helperText={showError ? error || submitError : helperText ? helperText : ""}
        // InputLabelProps={{
        //   shrink: true,
        // }}
        // margin="dense"
        // variant="outlined"
        // InputProps={inputProps}
        // inputProps={{
        //   autoComplete: "off",
        //   required: false, // bypass html5 required feature
        // }}
      />
    </FormControl>
  );
};
