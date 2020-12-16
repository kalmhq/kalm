import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      borderRadius: "4px",
    },
  });

export interface RichEditorProps extends WithStyles<typeof styles> {
  value: string;
  mode?: string;
  readOnly?: boolean;
  onChange?: (value: string, event?: any) => void;
  onBlur?: (value: string, event?: any) => void;
  height?: string;
  wrapEnabled?: boolean;
  tabSize?: number;
}

interface State {
  AceEditor?: any;
  mode: string;
}

// https://github.com/securingsincity/react-ace/issues/305
const detectMode = (text: string): string => {
  text = text.replace(/\s/g, "");
  if (text.startsWith('{"')) {
    return "json";
  } else if (text.startsWith("---") || text.match(/^[a-zA-Z0-9]*:/)) {
    return "yaml";
  } else if (text.startsWith("server{")) {
    return "nginx";
  } else {
    return "text";
  }
};

class RichEditorRaw extends React.PureComponent<RichEditorProps, State> {
  constructor(props: RichEditorProps) {
    super(props);
    this.state = {
      mode: "text",
    };
  }

  private getMode() {
    if (this.props.mode) {
      return this.props.mode;
    }
    return detectMode(this.props.value);
  }

  public componentDidMount() {
    const mode = this.getMode();

    import("react-ace").then((AceEditor) => {
      if (mode === "json") {
        import("ace-builds/src-noconflict/mode-json");
      } else if (mode === "yaml") {
        import("ace-builds/src-noconflict/mode-yaml");
      } else if (mode === "nginx") {
        import("ace-builds/src-noconflict/mode-nginx");
      } else {
        import("ace-builds/src-noconflict/mode-text");
      }

      import("ace-builds/src-noconflict/theme-monokai");
      this.setState({ AceEditor: AceEditor.default });
    });
  }

  public render() {
    const { AceEditor } = this.state;
    if (!AceEditor) {
      return null;
    }

    const { readOnly, tabSize, height, wrapEnabled, classes, value, onChange, onBlur } = this.props;
    return (
      <AceEditor
        className={classes.root}
        mode={this.getMode()}
        theme="monokai"
        value={value}
        height={height}
        onChange={onChange}
        onBlur={onBlur}
        readOnly={readOnly}
        tabSize={tabSize}
        name="rich-editor"
        width="100%"
        wrapEnabled={wrapEnabled}
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

export const RichEditor = withStyles(styles)(RichEditorRaw);
