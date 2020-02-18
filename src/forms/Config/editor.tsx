import React from "react";
import { FilledTextFieldProps } from "@material-ui/core/TextField";
import { WrappedFieldProps, BaseFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";

const aceOnBlur = (onBlur: any) => (_event: any, editor?: any) => {
  const value = editor.getValue();
  onBlur(value);
};

const renderEditor = ({ input }: FilledTextFieldProps & WrappedFieldProps) => {
  return (
    <AceEditor
      placeholder="Input file content here."
      mode="javascript"
      theme="monokai"
      name="editor"
      height="400px"
      width="100%"
      //   onLoad={console.log}
      onBlur={aceOnBlur(input.onBlur)}
      onChange={input.onChange}
      value={input.value}
      fontSize={14}
      showPrintMargin={false}
      showGutter={true}
      highlightActiveLine={true}
      //       value={`function onLoad(editor) {
      //   console.log("i've loaded");
      // }`}
      setOptions={{
        useWorker: false,
        enableBasicAutocompletion: false,
        enableLiveAutocompletion: false,
        enableSnippets: false,
        showLineNumbers: true,
        tabSize: 1
      }}
    />
  );
};

export const CustomEditor = (props: any) => {
  return <Field name="content" component={renderEditor} />;
};
