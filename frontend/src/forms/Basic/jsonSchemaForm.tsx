import { Button } from "@material-ui/core";
import { withTheme } from "@rjsf/core";
import { Theme as MuiTheme } from "@rjsf/material-ui";
import Immutable, { isImmutable } from "immutable";
import React from "react";
import { WrappedFieldProps } from "redux-form";
import { TDispatchProp } from "types";

const Form = withTheme(MuiTheme);

interface Props extends TDispatchProp {
  schema: any;
}

interface State {}

export class RenderJsonSchemaForm extends React.PureComponent<Props & WrappedFieldProps, State> {
  constructor(props: Props & WrappedFieldProps) {
    super(props);
    this.state = {};
  }

  public render() {
    const { input, schema } = this.props;
    return (
      <div>
        <Form
          schema={schema}
          formData={isImmutable(input.value) ? input.value.toJS() : input.value}
          // onSubmit={() => console.log("RenderPluginConfig onSubmit")}
          // onError={() => console.log("RenderPluginConfig onError")}
          onChange={(v) => {
            input.onChange(Immutable.fromJS(v.formData));
          }}
        >
          <Button variant="contained" color="primary" type="submit" style={{ display: "none" }}>
            hidden
          </Button>
        </Form>
      </div>
    );
  }
}
