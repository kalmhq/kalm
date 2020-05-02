import { Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { withTheme } from "@rjsf/core";
import { Theme as MuiTheme } from "@rjsf/material-ui";
import Immutable, { isImmutable } from "immutable";
import { JSONSchema7 } from "json-schema";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { TDispatchProp } from "types";

const Form = withTheme(MuiTheme);

const schema: JSONSchema7 = {
  title: "A list of tasks",
  type: "object",
  required: ["title"],
  properties: {
    title: {
      type: "string",
      title: "Task list title"
    },
    tasks: {
      type: "array",
      title: "Tasks",
      items: {
        type: "object",
        required: ["title"],
        properties: {
          title: {
            type: "string",
            title: "Title",
            description: "A sample title"
          },
          details: {
            type: "string",
            title: "Task details",
            description: "Enter the task details"
          },
          done: {
            type: "boolean",
            title: "Done?",
            default: false
          }
        }
      }
    }
  }
};

const styles = (theme: Theme) =>
  createStyles({
    root: {}
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class RenderPluginsRaw extends React.PureComponent<Props & WrappedFieldProps, State> {
  constructor(props: Props & WrappedFieldProps) {
    super(props);
    this.state = {};
  }

  public render() {
    const { classes, input } = this.props;
    return (
      <div className={classes.root}>
        <Form
          schema={schema}
          formData={isImmutable(input.value) ? input.value.toJS() : input.value}
          onChange={v => {
            input.onChange(Immutable.fromJS(v.formData));
          }}
          onSubmit={() => console.log("RenderPlugins onSubmit")}
          onError={() => console.log("RenderPlugins onError")}>
          <Button variant="contained" color="primary" type="submit" style={{ display: "none" }}>
            hidden
          </Button>
        </Form>
      </div>
    );
  }
}

export const Plugins = withStyles(styles)(
  connect(mapStateToProps)((props: Props) => {
    return <Field name="plugins" component={RenderPluginsRaw} {...props} />;
  })
);
