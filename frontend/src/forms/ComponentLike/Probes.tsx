import { Grid, Typography, Box } from "@material-ui/core";
import { NormalizeNumber, NormalizeNumberOrAlphabet } from "forms/normalizer";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { HttpHeader, HttpHeaders } from "../../types/componentTemplate";
import { H5 } from "../../widgets/Label";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField, RenderComplexValueTextField } from "../Basic/textfield";
import { ValidatorHttpHeaders, ValidatorNumberOrAlphabet, ValidatorRequired } from "../validator";

interface FieldComponentHackType {
  name: any;
  component: any;
  label: any;
}

interface FieldProps extends DispatchProp {}

interface Props extends WrappedFieldProps, FieldComponentHackType, FieldProps {}

interface State {
  type: string;
}

class RenderProbe extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      type: ""
    };
  }

  public componentDidMount() {
    const input = this.props.input;
    const value = this.props.input.value;

    // console.log(value.get && value.get("httpGet") && value.get("httpGet").toJS());

    // if have get method
    if (value.get) {
      if (value.get("httpGet")) {
        this.setState({ type: "httpGet" });
        input.onChange(value.set("type", "httpGet"));
      } else if (value.get("exec")) {
        this.setState({ type: "exec" });
        input.onChange(value.set("type", "exec"));
      } else if (value.get("tcpSocket")) {
        this.setState({ type: "tcpSocket" });
        input.onChange(value.set("type", "tcpSocket"));
      }
    }
  }

  private handleChangeType(type: string) {
    const input = this.props.input;
    const value = this.props.input.value;
    this.setState({ type });

    if (value.delete) {
      if (type === "httpGet") {
        input.onChange(value.delete("exec").delete("tcpSocket"));
      } else if (type === "exec") {
        input.onChange(value.delete("httpGet").delete("tcpSocket"));
      } else if (type === "tcpSocket") {
        input.onChange(value.delete("httpGet").delete("exec"));
      } else {
        input.onChange(
          value
            .delete("httpGet")
            .delete("exec")
            .delete("tcpSocket")
        );
      }
    }
  }

  private renderHttpGet() {
    const name = this.props.input.name;
    return (
      <>
        <Grid item md={12}>
          <Field component={KRenderTextField} name={`${name}.httpGet.host`} label="Host" margin helperText="" />
        </Grid>
        <Grid item md={12}>
          <Field
            component={KRenderTextField}
            name={`${name}.httpGet.port`}
            label="Port"
            margin
            helperText=""
            validate={[ValidatorRequired]}
            normalize={NormalizeNumber}
          />
        </Grid>
        <Grid item md={12}>
          <Field component={KRenderTextField} name={`${name}.httpGet.path`} label="Path" margin helperText="" />
        </Grid>
        <Grid item md={12}>
          <Field component={KRenderTextField} name={`${name}.httpGet.scheme`} label="Scheme" margin helperText="" />
        </Grid>
        <Grid item md={12}>
          <Field
            component={RenderComplexValueTextField}
            name={`${name}.httpGet.httpHeaders`}
            label="httpHeaders"
            margin
            helperText='Eg: {"name1": "value1", "name2": "value2"}'
            validate={[ValidatorHttpHeaders]}
            formValueToEditValue={(value: HttpHeaders) => {
              if (!value) {
                return "";
              }

              if (typeof value === "string") {
                return value;
              }

              const json: { [key: string]: string } = {};
              value.forEach(httpHeader => {
                json[httpHeader.get("name")] = httpHeader.get("value");
              });

              return JSON.stringify(json);
            }}
            editValueToFormValue={(value: any) => {
              if (!value) {
                // Optional field
                return undefined;
              }

              const httpHeaders: HttpHeader[] = [];
              let json;
              try {
                json = JSON.parse(value);
              } catch (e) {
                // for validate
                return value;
              }
              for (const key in json) {
                httpHeaders.push(
                  Immutable.Map({
                    name: key,
                    value: json[key]
                  })
                );
              }

              return Immutable.List(httpHeaders);
            }}
          />
        </Grid>
      </>
    );
  }
  private renderExec() {
    const name = this.props.input.name;
    return (
      <Grid item xs={12} sm={12} md={12}>
        <Field
          component={RenderComplexValueTextField}
          name={`${name}.exec.command`}
          label="Command"
          margin
          helperText='Eg: "/bin/app", "rails server".'
          formValueToEditValue={(value: Immutable.List<string>) => {
            return value && value.toArray && value.toArray().join(" ") ? value.toArray().join(" ") : "";
          }}
          editValueToFormValue={(value: any) => {
            return value ? Immutable.List([value]) : Immutable.List([]);
          }}
        />
      </Grid>
    );
  }

  private renderTcpSocket() {
    const name = this.props.input.name;
    return (
      <>
        <Grid item md={12}>
          <Field component={KRenderTextField} name={`${name}.tcpSocket.host`} label="Host" margin helperText="" />
        </Grid>
        <Grid item md={12}>
          <Field
            component={KRenderTextField}
            name={`${name}.tcpSocket.port`}
            label="Port"
            margin
            helperText=""
            validate={[ValidatorRequired, ValidatorNumberOrAlphabet]}
            normalize={NormalizeNumberOrAlphabet}
          />
        </Grid>
      </>
    );
  }

  private renderCommon() {
    const name = this.props.input.name;

    return (
      <>
        <Grid item xs={6} sm={6} md={6}>
          <Field
            component={KRenderTextField}
            name={`${name}.initialDelaySeconds`}
            label="InitialDelaySeconds"
            normalize={NormalizeNumber}
            margin
            helperText=""
          />
        </Grid>
        <Grid item xs={6} sm={6} md={6}>
          <Field
            component={KRenderTextField}
            name={`${name}.timeoutSeconds`}
            label="TimeoutSeconds"
            normalize={NormalizeNumber}
            margin
            helperText=""
          />
        </Grid>
        <Grid item xs={4} sm={4} md={4}>
          <Field
            component={KRenderTextField}
            name={`${name}.periodSeconds`}
            label="PeriodSeconds"
            normalize={NormalizeNumber}
            margin
            helperText=""
          />
        </Grid>
        <Grid item xs={4} sm={4} md={4}>
          <Field
            component={KRenderTextField}
            name={`${name}.successThreshold`}
            label="SuccessThreshold"
            normalize={NormalizeNumber}
            margin
            helperText=""
          />
        </Grid>
        <Grid item xs={4} sm={4} md={4}>
          <Field
            component={KRenderTextField}
            name={`${name}.failureThreshold`}
            label="FailureThreshold"
            normalize={NormalizeNumber}
            margin
            helperText=""
          />
        </Grid>
      </>
    );
  }

  public render() {
    // console.log(this.props);
    const { type } = this.state;
    const { label } = this.props;
    const name = this.props.input.name;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={12}>
          <H5>{label}</H5>
        </Grid>

        <Grid item xs={12} sm={12} md={12}>
          <Field
            name={`${name}.type`}
            component={RenderSelectField}
            label="Type"
            value={type}
            onChange={(value: any) => {
              this.handleChangeType(value);
            }}
            options={[
              { value: "", text: "None" },
              {
                value: "httpGet",
                selectedText: "Http Get Request",
                text: (
                  <Box pt={1} pb={1}>
                    <Typography variant="h6">Http Get Request</Typography>
                    <Typography variant="caption">
                      Http get request returns successful response (status {">="} 200 and {"<"} 400).
                    </Typography>
                  </Box>
                )
              },
              {
                value: "exec",
                selectedText: "Command",
                text: (
                  <Box pt={1} pb={1}>
                    <Typography variant="h6">Command</Typography>
                    <Typography variant="caption">Execute command returns 0 exit code.</Typography>
                  </Box>
                )
              },
              {
                value: "tcpSocket",
                selectedText: "TCP",
                text: (
                  <Box pt={1} pb={1}>
                    <Typography variant="h6">TCP</Typography>
                    <Typography variant="caption">Establish a TCP connection Successfully.</Typography>
                  </Box>
                )
              }
            ]}></Field>
        </Grid>

        {type === "httpGet" && this.renderHttpGet()}
        {type === "exec" && this.renderExec()}
        {type === "tcpSocket" && this.renderTcpSocket()}

        {type !== "" && this.renderCommon()}
      </Grid>
    );
  }
}

export const LivenessProbe = connect()((props: FieldProps) => {
  return <Field name="livenessProbe" label="LivenessProbe" component={RenderProbe} {...props} />;
});

export const ReadinessProbe = connect()((props: FieldProps) => {
  return <Field name="readinessProbe" label="ReadinessProbe" component={RenderProbe} {...props} />;
});
