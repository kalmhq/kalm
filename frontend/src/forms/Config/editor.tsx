import React from "react";
import { FilledTextFieldProps } from "@material-ui/core/TextField";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-nginx";
import { grey } from "@material-ui/core/colors";

const aceOnBlur = (onBlur: any) => (_event: any, editor?: any) => {
  const value = editor.getValue();
  onBlur(value);
};

const detectMode = (text: string): string => {
  text = text.replace(/\s/g, "");
  if (text.startsWith('{"')) {
    return "javascript";
  } else if (text.startsWith("server{")) {
    return "nginx";
  } else {
    return "yaml";
  }
};

const renderEditor = ({ input }: FilledTextFieldProps & WrappedFieldProps) => {
  return (
    <AceEditor
      placeholder="Input file content here."
      mode={detectMode(input.value)}
      theme="tomorrow"
      name="editor"
      height="400px"
      width="100%"
      style={{ border: `1px solid ${grey[400]}`, borderRadius: 4 }}
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
  return <Field name="content" required component={renderEditor} />;
};
