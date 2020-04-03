import { MenuItem, Grid, Typography } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { HttpHeaders, HttpHeader } from "../../types/componentTemplate";
import { HelperContainer } from "../../widgets/Helper";
import { CustomTextField, RenderSelectField } from "../Basic";
import { ValidatorRequired, ValidatorHttpHeaders } from "../validator";

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

  private renderHttpGet() {
    const name = this.props.input.name;
    return (
      <>
        <Grid item md={6}>
          <CustomTextField name={`${name}.httpGet.host`} label="Host (Optional)" margin helperText="" />
        </Grid>
        <Grid item md={6}>
          <CustomTextField
            name={`${name}.httpGet.port`}
            label="Port"
            margin
            helperText=""
            validate={[ValidatorRequired]}
          />
        </Grid>
        <Grid item md={6}>
          <CustomTextField name={`${name}.httpGet.path`} label="Path (Optional)" margin helperText="" />
        </Grid>
        <Grid item md={6}>
          <CustomTextField name={`${name}.httpGet.scheme`} label="Scheme (Optional)" margin helperText="" />
        </Grid>
        <Grid item md={6}>
          <CustomTextField
            name={`${name}.httpGet.httpHeaders`}
            label="httpHeaders (Optional)"
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
      <Grid item md={6}>
        <CustomTextField
          name={`${name}.exec.host`}
          label="Command (Optional)"
          margin
          helperText='Eg: "/bin/app", "rails server".'
          formValueToEditValue={(value: Immutable.List<string>) => {
            return value && value.toArray().join(" ") ? value.toArray().join(" ") : "";
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
        <Grid item md={6}>
          <CustomTextField name={`${name}.tcpSocket.host`} label="Host (Optional)" margin helperText="" />
        </Grid>
        <Grid item md={6}>
          <CustomTextField
            name={`${name}.tcpSocket.port`}
            label="Port"
            margin
            helperText=""
            validate={[ValidatorRequired]}
          />
        </Grid>
      </>
    );
  }

  private renderCommon() {
    const name = this.props.input.name;

    return (
      <>
        <Grid item md={6}>
          <CustomTextField
            name={`${name}.initialDelaySeconds`}
            label="InitialDelaySeconds (Optional)"
            margin
            helperText=""
          />
        </Grid>
        <Grid item md={6}>
          <CustomTextField name={`${name}.timeoutSeconds`} label="TimeoutSeconds (Optional)" margin helperText="" />
        </Grid>
        <Grid item md={6}>
          <CustomTextField name={`${name}.periodSeconds`} label="PeriodSeconds (Optional)" margin helperText="" />
        </Grid>
        <Grid item md={6}>
          <CustomTextField name={`${name}.successThreshold`} label="SuccessThreshold (Optional)" margin helperText="" />
        </Grid>
        <Grid item md={6}>
          <CustomTextField name={`${name}.failureThreshold`} label="FailureThreshold (Optional)" margin helperText="" />
        </Grid>
      </>
    );
  }

  public render() {
    console.log(this.props);
    const { type } = this.state;
    const { label } = this.props;
    const name = this.props.input.name;

    return (
      <>
        <Grid item md={12}>
          <HelperContainer>
            <Typography>{label}</Typography>
          </HelperContainer>
        </Grid>

        <Grid item md={6}>
          <Field
            name={`${name}.type`}
            component={RenderSelectField}
            label="Type"
            onChange={(value: any) => {
              this.setState({ type: value });
            }}>
            <MenuItem value={""}>none</MenuItem>
            <MenuItem value={"httpGet"}>httpGet</MenuItem>
            <MenuItem value={"exec"}>exec</MenuItem>
            <MenuItem value={"tcpSocket"}>tcpSocket</MenuItem>
          </Field>
        </Grid>

        {type === "httpGet" && this.renderHttpGet()}
        {type === "exec" && this.renderExec()}
        {type === "tcpSocket" && this.renderTcpSocket()}

        {type !== "" && this.renderCommon()}
      </>
    );
  }
}

export const LivenessProbe = connect()((props: FieldProps) => {
  return <Field name="livenessProbe" label="LivenessProbe" component={RenderProbe} {...props} />;
});

export const ReadinessProbe = connect()((props: FieldProps) => {
  return <Field name="readinessProbe" label="ReadinessProbe" component={RenderProbe} {...props} />;
});
