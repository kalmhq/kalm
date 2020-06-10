import {
  Box,
  createStyles,
  Grid,
  StandardTextFieldProps,
  TextField,
  Theme,
  Typography,
  withStyles
} from "@material-ui/core";
import { WithStyles } from "@material-ui/styles";
import { NormalizeNumber, NormalizeNumberOrAlphabet } from "forms/normalizer";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldProps, WrappedFieldArrayProps, change, unregisterField, clearFields } from "redux-form";
import { Field, formValueSelector } from "redux-form/immutable";
import { H5 } from "../../widgets/Label";
import { RenderSelectField, SelectField } from "../Basic/select";
import { KRenderCommandTextField, KRenderTextField } from "../Basic/textfield";
import { ValidatorNumberOrAlphabet, ValidatorRequired } from "../validator";
import { RootState } from "reducers";
import { Probe, ComponentLikePort } from "types/componentTemplate";
import Immutable from "immutable";
import { portTypeTCP } from "types/common";

interface FieldComponentHackType {
  name: any;
  component: any;
}

const mapStateToProps = (state: RootState, { meta: { form } }: WrappedFieldArrayProps) => {
  const selector = formValueSelector(form);
  const readinessProbe = selector(state, "readinessProbe") as Probe | undefined;
  const livenessProbe = selector(state, "livenessProbe") as Probe | undefined;
  const ports = selector(state, "ports") as Immutable.List<ComponentLikePort> | undefined;
  return { readinessProbe, livenessProbe, ports };
};

interface FieldProps extends DispatchProp {}

interface Props
  extends WrappedFieldProps,
    FieldComponentHackType,
    FieldProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps> {}

const styles = (theme: Theme) =>
  createStyles({
    input: {
      padding: 2,
      textAlign: "center",
      width: 60,
      "&::placeholder": {
        textAlign: "center"
      }
    },
    code: {
      fontFamily: "Hack, monospace",
      "& input": {
        fontFamily: "Hack, monospace"
      }
    }
  });

class RenderProbe extends React.PureComponent<Props> {
  constructor(props: Props) {
    super(props);
  }

  private renderNestedTextfield = ({
    input,
    meta: { error, touched },
    placeholder,
    style,
    type
  }: WrappedFieldProps & StandardTextFieldProps & { style?: any; type?: string }) => {
    const { classes } = this.props;
    return (
      <TextField
        error={touched && !!error}
        helperText={touched && !!error ? error : undefined}
        InputProps={{ classes: { input: classes.input } }}
        onChange={input.onChange}
        value={input.value}
        size="small"
        type={type}
        placeholder={placeholder}
        inputProps={{ style }}
      />
    );
  };

  private renderHttpGet() {
    const name = this.props.input.name;
    const { classes } = this.props;
    return (
      <Box p={1}>
        <Typography>
          After initial
          <Field
            name={`${name}.initialDelaySeconds`}
            component={this.renderNestedTextfield}
            normalize={NormalizeNumber}
            placeholder="5"
            type="number"
            min="1"
            style={{ width: 60 }}
          />
          seconds delay, Request{" "}
          <Box className={classes.code} display="inline-block">
            <Field
              name={`${name}.httpGet.scheme`}
              component={this.renderNestedTextfield}
              placeholder="http"
              style={{ width: 60 }}
            />
            ://
            <Field
              name={`${name}.httpGet.host`}
              component={this.renderNestedTextfield}
              placeholder="0.0.0.0"
              style={{ width: 80 }}
            />
            :
            <Field
              name={`${name}.httpGet.port`}
              component={this.renderNestedTextfield}
              placeholder="8080"
              normalize={NormalizeNumber}
              validate={ValidatorRequired}
              style={{ width: 60 }}
            />
            <Field
              name={`${name}.httpGet.path`}
              component={this.renderNestedTextfield}
              placeholder="/healthy"
              validate={ValidatorRequired}
              style={{ width: 80, textAlign: "left" }}
            />
          </Box>{" "}
          will be triggered every{" "}
          <Field
            name={`${name}.periodSeconds`}
            component={this.renderNestedTextfield}
            normalize={NormalizeNumber}
            placeholder="5"
            type="number"
            min="1"
            style={{ width: 60 }}
          />{" "}
          seconds.
        </Typography>
      </Box>
    );
  }
  private renderExec() {
    const name = this.props.input.name;
    const { classes } = this.props;
    return (
      <Box p={1}>
        <Typography>
          After initial
          <Field
            name={`${name}.initialDelaySeconds`}
            component={this.renderNestedTextfield}
            placeholder="5"
            normalize={NormalizeNumber}
            type="number"
            min="1"
            style={{ width: 60 }}
          />
          seconds delay, Command{" "}
          <Box className={classes.code} display="inline-block">
            <Field
              name={`${name}.exec.command`}
              component={this.renderNestedTextfield}
              validate={ValidatorRequired}
              placeholder="command"
              style={{ width: 200 }}
            />
          </Box>{" "}
          will be executed every{" "}
          <Field
            name={`${name}.periodSeconds`}
            component={this.renderNestedTextfield}
            normalize={NormalizeNumber}
            placeholder="5"
            type="number"
            min="1"
            style={{ width: 60 }}
          />{" "}
          seconds.
        </Typography>
      </Box>
    );
  }

  private renderTcpSocket() {
    const name = this.props.input.name;
    const { classes } = this.props;
    return (
      <Box p={1}>
        <Typography>
          After initial
          <Field
            name={`${name}.initialDelaySeconds`}
            component={this.renderNestedTextfield}
            normalize={NormalizeNumber}
            placeholder="5"
            type="number"
            min="1"
            style={{ width: 60 }}
          />
          seconds delay, TCP socket connection to{" "}
          <Box className={classes.code} display="inline-block">
            <Field
              name={`${name}.tcpSocket.host`}
              component={this.renderNestedTextfield}
              placeholder="0.0.0.0"
              style={{ width: 200 }}
            />
            :
            <Field
              name={`${name}.tcpSocket.port`}
              component={this.renderNestedTextfield}
              validate={ValidatorRequired}
              normalize={NormalizeNumber}
              placeholder="8080"
              style={{ width: 60 }}
            />
          </Box>{" "}
          will be established every{" "}
          <Field
            name={`${name}.periodSeconds`}
            component={this.renderNestedTextfield}
            normalize={NormalizeNumber}
            placeholder="5"
            type="number"
            min="1"
            style={{ width: 60 }}
          />{" "}
          seconds.
        </Typography>
      </Box>
    );
  }

  private renderCommon() {
    const name = this.props.input.name;
    const type = this.getProbeType();

    return (
      <Box p={1}>
        <Typography>
          If there is no response within{" "}
          <Field
            name={`${name}.timeoutSeconds`}
            component={this.renderNestedTextfield}
            placeholder="5"
            normalize={NormalizeNumber}
            style={{ width: 60 }}
            type="number"
            min="1"
          />{" "}
          seconds or{" "}
          {type === "httpGet"
            ? "an error response (http status code >= 400) is returned"
            : type === "exec"
            ? "the command exits with a non-zero code"
            : "the TCP connection is failed"}
          , the current round of testing is considered to have failed. Otherwise, the it is considered successful.
        </Typography>
        <br />
        <Typography>
          {name === "livenessProbe" ? (
            "One successful testing"
          ) : (
            <>
              <Field
                name={`${name}.successThreshold`}
                component={this.renderNestedTextfield}
                placeholder="5"
                normalize={NormalizeNumber}
                style={{ width: 60 }}
                type="number"
                min="1"
              />
              consecutive successful tesings
            </>
          )}{" "}
          will make the probe ready.{" "}
          <Field
            name={`${name}.failureThreshold`}
            component={this.renderNestedTextfield}
            placeholder="5"
            normalize={NormalizeNumber}
            type="number"
            min="1"
            style={{ width: 60 }}
          />{" "}
          consecutive failed tesings will make the probe faild.
        </Typography>
      </Box>
    );
  }

  private getProbeObject = () => {
    const name = this.props.input.name;
    let probe: Probe | undefined;

    if (name === "livenessProbe") {
      probe = this.props.livenessProbe;
    } else {
      probe = this.props.readinessProbe;
    }

    return probe;
  };

  private handleChangeType(type: string) {
    const {
      ports,
      dispatch,
      meta: { form },
      input
    } = this.props;

    if (type === "httpGet") {
      const potentialPort = ports
        ? ports.find(x => x.get("protocol") === portTypeTCP && !!x.get("containerPort"))
        : null;
      dispatch(
        change(
          form,
          input.name,
          Immutable.Map({
            httpGet: Immutable.Map({
              path: "/health",
              port: potentialPort ? potentialPort.get("containerPort") : ""
            })
          })
        )
      );
    } else if (type === "exec") {
      dispatch(
        change(
          form,
          input.name,
          Immutable.Map({
            exec: Immutable.Map({
              command: ""
            })
          })
        )
      );
    } else if (type === "tcpSocket") {
      const potentialPort = ports
        ? ports.find(x => x.get("protocol") === portTypeTCP && !!x.get("containerPort"))
        : null;
      dispatch(
        change(
          form,
          input.name,
          Immutable.Map({
            tcpSocket: Immutable.Map({
              port: potentialPort ? potentialPort.get("containerPort") : ""
            })
          })
        )
      );
    } else {
      dispatch(change(form, input.name, null));
    }
  }

  private getProbeType = () => {
    const probe = this.getProbeObject();

    return !probe
      ? "none"
      : !!probe.get("httpGet")
      ? "httpGet"
      : !!probe.get("exec")
      ? "exec"
      : !!probe.get("tcpSocket")
      ? "tcpSocket"
      : "none";
  };

  public render() {
    const type = this.getProbeType();
    return (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <SelectField
            label="Type"
            value={type}
            onChange={(event: any) => {
              this.handleChangeType(event.target.value);
            }}
            meta={{
              touched: true,
              error: undefined
            }}
            options={[
              { value: "none", text: "None" },
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
            ]}
          />
        </Grid>

        {type === "httpGet" && this.renderHttpGet()}
        {type === "exec" && this.renderExec()}
        {type === "tcpSocket" && this.renderTcpSocket()}
        {type !== "none" && this.renderCommon()}
      </Grid>
    );
  }
}

export const LivenessProbe = connect()((props: FieldProps) => {
  return (
    <Field name="livenessProbe" component={withStyles(styles)(connect(mapStateToProps)(RenderProbe))} {...props} />
  );
});

export const ReadinessProbe = connect()((props: FieldProps) => {
  return (
    <Field name="readinessProbe" component={withStyles(styles)(connect(mapStateToProps)(RenderProbe))} {...props} />
  );
});
