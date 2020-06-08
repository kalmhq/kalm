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
import { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { H5 } from "../../widgets/Label";
import { RenderSelectField } from "../Basic/select";
import { KRenderCommandTextField, KRenderTextField } from "../Basic/textfield";
import { ValidatorNumberOrAlphabet, ValidatorRequired } from "../validator";

interface FieldComponentHackType {
  name: any;
  component: any;
  label: any;
}

interface FieldProps extends DispatchProp {}

interface Props extends WrappedFieldProps, FieldComponentHackType, FieldProps, WithStyles<typeof styles> {}

interface State {
  type: string;
}

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

  private renderNestedTextfield = ({
    input,
    placeholder,
    style,
    type
  }: WrappedFieldProps & StandardTextFieldProps & { style?: any; type?: string }) => {
    const { classes } = this.props;
    return (
      <TextField
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
              style={{ width: 60 }}
            />
            <Field
              name={`${name}.httpGet.path`}
              component={this.renderNestedTextfield}
              placeholder="/healthy"
              style={{ width: 80, textAlign: "left" }}
            />
          </Box>{" "}
          will be triggered every{" "}
          <Field
            name={`${name}.periodSeconds`}
            component={this.renderNestedTextfield}
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
            type="number"
            min="1"
            style={{ width: 60 }}
          />
          seconds delay, Command{" "}
          <Box className={classes.code} display="inline-block">
            <Field
              name={`${name}.exec.command`}
              component={this.renderNestedTextfield}
              placeholder="command"
              style={{ width: 200 }}
            />
          </Box>{" "}
          will be executed every{" "}
          <Field
            name={`${name}.periodSeconds`}
            component={this.renderNestedTextfield}
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
              placeholder="8080"
              style={{ width: 60 }}
            />
          </Box>{" "}
          will be established every{" "}
          <Field
            name={`${name}.periodSeconds`}
            component={this.renderNestedTextfield}
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
    const { type } = this.state;
    return (
      <Box p={1}>
        <Typography>
          If there is no response within{" "}
          <Field
            name={`${name}.timeoutSeconds`}
            component={this.renderNestedTextfield}
            placeholder="5"
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
            type="number"
            min="1"
            style={{ width: 60 }}
          />{" "}
          consecutive failed tesings will make the probe faild.
        </Typography>
      </Box>
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

        <Grid item xs={6}>
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
  return <Field name="livenessProbe" label="LivenessProbe" component={withStyles(styles)(RenderProbe)} {...props} />;
});

export const ReadinessProbe = connect()((props: FieldProps) => {
  return <Field name="readinessProbe" label="ReadinessProbe" component={withStyles(styles)(RenderProbe)} {...props} />;
});
