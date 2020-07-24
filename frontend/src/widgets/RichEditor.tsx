import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      borderRadius: "4px",
    },
  });

interface Props extends WithStyles<typeof styles> {
  value: string;
  onChange?: (value: string, event?: any) => void;
}

interface State {}

class RichEdtorRaw extends React.PureComponent<Props, State> {
  public render() {
    const { classes, value, onChange } = this.props;
    return (
      <AceEditor
        className={classes.root}
        theme="monokai"
        value={value}
        onChange={onChange}
        name="rich-editor"
        width="100%"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
        }}
      />
    );
  }
}

export const RichEdtor = withStyles(styles)(RichEdtorRaw);
