import {
  Box,
  createStyles,
  Grid,
  makeStyles,
  MenuItem,
  StandardTextFieldProps,
  TextField,
  Theme,
  Typography,
  withStyles,
} from "@material-ui/core";
import { WithStyles } from "@material-ui/styles";
import { NormalizePositiveNumber, trimParse } from "forms/normalizer";
import React from "react";
import { Field, FieldRenderProps } from "react-final-form";
import { ComponentLikePort, PortProtocolHTTP, PortProtocolTCP, Probe } from "types/componentTemplate";
import sc from "../../utils/stringConstants";
import { KSelect, makeSelectOption } from "../Final/select";
import { ValidatorOneOfFactory, ValidatorRequired } from "../validator";

const ValidatorScheme = ValidatorOneOfFactory(["HTTP", "HTTPS"]);

interface OwnProps {
  name: "livenessProbe" | "readinessProbe";
  value?: Probe;
  change: any;
  ports?: ComponentLikePort[];
}

interface Props extends WithStyles<typeof styles>, OwnProps {}

const styles = (theme: Theme) =>
  createStyles({
    code: {
      fontFamily: "Hack, monospace",
      "& input": {
        fontFamily: "Hack, monospace",
      },
    },
  });

const RenderNestedTextfield = ({
  input: { value, onChange, onBlur },
  meta: { error, touched, active },
  placeholder,
  style,
  select,
  children,
  type,
}: FieldRenderProps<string | number | undefined> &
  StandardTextFieldProps & { style?: any; type?: string; normalize?: any }) => {
  const classes = makeStyles((theme) => ({
    input: {
      padding: 2,
      textAlign: "center",
      width: 60,
      "&::placeholder": {
        textAlign: "center",
      },
    },
  }))();

  return (
    <TextField
      error={!!error && touched}
      helperText={touched && error}
      InputProps={{ classes: { input: classes.input } }}
      onChange={onChange}
      onBlur={onBlur}
      value={value}
      size="small"
      type={type}
      select={select}
      placeholder={placeholder}
      inputProps={{ style }}
    >
      {children}
    </TextField>
  );
};

class RenderProbe extends React.PureComponent<Props> {
  private renderHttpGet() {
    const { classes, name } = this.props;

    return (
      <Box p={1}>
        <Typography component="div">
          After initial
          <Field
            name={`${name}.initialDelaySeconds`}
            component={RenderNestedTextfield}
            parse={NormalizePositiveNumber}
            placeholder="10"
            type="number"
            min="1"
            style={{ width: 60 }}
          />
          seconds delay, Request{" "}
          <Box className={classes.code} display="inline-block">
            <Field
              name={`${name}.httpGet.scheme`}
              component={RenderNestedTextfield}
              validate={ValidatorScheme}
              placeholder="http"
              select
              style={{ width: 60 }}
            >
              <MenuItem key={"http"} value={"HTTP"}>
                http
              </MenuItem>
              <MenuItem key={"http"} value={"HTTPS"}>
                https
              </MenuItem>
            </Field>
            ://
            <Field<string | undefined>
              name={`${name}.httpGet.host`}
              component={RenderNestedTextfield}
              placeholder="localhost"
              style={{ width: 80 }}
            />
            :
            <Field
              name={`${name}.httpGet.port`}
              component={RenderNestedTextfield}
              placeholder="8080"
              parse={NormalizePositiveNumber}
              validate={ValidatorRequired}
              style={{ width: 60 }}
            />
            <Field
              name={`${name}.httpGet.path`}
              component={RenderNestedTextfield}
              placeholder="/healthy"
              style={{ width: 80, textAlign: "left" }}
            />
          </Box>{" "}
          will be triggered every{" "}
          <Field
            name={`${name}.periodSeconds`}
            component={RenderNestedTextfield}
            parse={NormalizePositiveNumber}
            placeholder="10"
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
    const { classes, name } = this.props;

    return (
      <Box p={1}>
        <Typography component="div">
          After initial
          <Field
            name={`${name}.initialDelaySeconds`}
            component={RenderNestedTextfield}
            placeholder="10"
            parse={NormalizePositiveNumber}
            type="number"
            min="1"
            style={{ width: 60 }}
          />
          seconds delay, Command{" "}
          <Box className={classes.code} display="inline-block">
            <Field
              name={`${name}.exec.command[0]`}
              component={RenderNestedTextfield}
              validate={ValidatorRequired}
              parse={trimParse}
              placeholder="command"
              style={{ width: 300 }}
            />
          </Box>{" "}
          will be executed every{" "}
          <Field
            name={`${name}.periodSeconds`}
            component={RenderNestedTextfield}
            parse={NormalizePositiveNumber}
            placeholder="10"
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
    const { classes, name } = this.props;

    return (
      <Box p={1}>
        <Typography component="div">
          After initial
          <Field
            name={`${name}.initialDelaySeconds`}
            component={RenderNestedTextfield}
            parse={NormalizePositiveNumber}
            placeholder="10"
            type="number"
            min="1"
            style={{ width: 60 }}
          />
          seconds delay, TCP socket connection to{" "}
          <Box className={classes.code} display="inline-block">
            <Field
              name={`${name}.tcpSocket.host`}
              component={RenderNestedTextfield}
              placeholder="0.0.0.0"
              style={{ width: 200 }}
            />
            :
            <Field
              name={`${name}.tcpSocket.port`}
              component={RenderNestedTextfield}
              validate={ValidatorRequired}
              parse={NormalizePositiveNumber}
              placeholder="8080"
              style={{ width: 60 }}
            />
          </Box>{" "}
          will be established every{" "}
          <Field
            name={`${name}.periodSeconds`}
            component={RenderNestedTextfield}
            parse={NormalizePositiveNumber}
            placeholder="10"
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
    const { name } = this.props;
    const type = this.getProbeType();

    return (
      <Box p={1}>
        <Typography component="div">
          If there is no response within{" "}
          <Field
            name={`${name}.timeoutSeconds`}
            component={RenderNestedTextfield}
            placeholder="1"
            parse={NormalizePositiveNumber}
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
        <Typography component="div">
          {name === "livenessProbe" ? (
            "One successful testing"
          ) : (
            <>
              <Field
                name={`${name}.successThreshold`}
                component={RenderNestedTextfield}
                placeholder="1"
                parse={NormalizePositiveNumber}
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
            component={RenderNestedTextfield}
            placeholder="3"
            parse={NormalizePositiveNumber}
            type="number"
            min="1"
            style={{ width: 60 }}
          />{" "}
          consecutive failed tesings will make the probe faild.
        </Typography>
      </Box>
    );
  }

  private handleChangeType(type: string) {
    const { change, ports, name } = this.props;

    if (type === "httpGet") {
      const potentialPort = ports ? ports.find((x) => x.protocol === PortProtocolHTTP && !!x.containerPort) : null;
      change(name, {
        httpGet: {
          scheme: "HTTP",
          path: "/health",
          port: potentialPort ? potentialPort.containerPort : 8080,
        },
        failureThreshold: 3,
        periodSeconds: 10,
        successThreshold: 1,
        timeoutSeconds: 1,
        initialDelaySeconds: 10,
      });
    } else if (type === "exec") {
      change(name, {
        exec: {
          command: [""],
        },
        failureThreshold: 3,
        periodSeconds: 10,
        successThreshold: 1,
        timeoutSeconds: 1,
        initialDelaySeconds: 10,
      });
    } else if (type === "tcpSocket") {
      const potentialPort = ports ? ports.find((x: any) => x.protocol === PortProtocolTCP && !!x.containerPort) : null;
      change(name, {
        tcpSocket: {
          port: potentialPort ? potentialPort.containerPort : 8080,
        },
        failureThreshold: 3,
        periodSeconds: 10,
        successThreshold: 1,
        timeoutSeconds: 1,
        initialDelaySeconds: 10,
      });
    } else {
      change(name, null);
    }
  }

  private getProbeType = () => {
    const { value: probe } = this.props;

    return !probe
      ? "none"
      : !!probe.httpGet
      ? "httpGet"
      : !!probe.exec
      ? "exec"
      : !!probe.tcpSocket
      ? "tcpSocket"
      : "none";
  };

  public render() {
    const type = this.getProbeType();

    return (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <KSelect
            label="Type"
            value={type}
            onChange={(event: any) => {
              this.handleChangeType(event.target.value);
            }}
            options={[
              makeSelectOption("none", "None", sc.PROBE_NONE_OPTION),
              makeSelectOption("httpGet", "HTTP", sc.PROBE_HTTP_OPTION),
              makeSelectOption("exec", "Command", sc.PROBE_COMMAND_OPTION),
              makeSelectOption("tcpSocket", "TCP", sc.PROBE_TCP_OPTION),
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

export const ProbeFields = withStyles(styles)(RenderProbe);
