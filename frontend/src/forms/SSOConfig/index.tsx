import { Box, createStyles, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import React from "react";
import { connect } from "react-redux";
import { Field, formValueSelector, getFormValues, reduxForm } from "redux-form/immutable";
import { RootState } from "reducers";
import {
  newEmptyGithubConnector,
  newEmptyGitlabConnector,
  newEmptySSOConfig,
  SSO_CONNECTOR_TYPE,
  SSO_CONNECTOR_TYPE_GITHUB,
  SSO_CONNECTOR_TYPE_GITLAB,
  SSOConfig,
} from "types/sso";
import { CustomizedButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { KRenderDebounceTextField } from "../Basic/textfield";
import { ValidateHost, ValidatorRequired } from "../validator";
import { Alert } from "@material-ui/lab";
import { shouldError } from "forms/common";
import { formValidateOrNotBlockByTutorial } from "tutorials/utils";
import { arrayPush, InjectedFormProps } from "redux-form";
import { SSO_CONFIG_FORM_ID } from "../formIDs";
import { Body } from "widgets/Label";
import Grid from "@material-ui/core/Grid";
import { CopyIconDefault, GithubIcon } from "widgets/Icon";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";
import { TDispatchProp } from "types";
import Button from "@material-ui/core/Button";
import { Prompt } from "widgets/Prompt";
import { Connectors } from "forms/SSOConfig/Connectors";
import sc from "utils/stringConstants";
import Immutable from "immutable";

const styles = (theme: Theme) =>
  createStyles({
    submitButton: {
      marginRight: theme.spacing(4),
    },
  });

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector(SSO_CONFIG_FORM_ID);
  const domain = selector(state, "domain") as string;
  const fieldValues = getFormValues(SSO_CONFIG_FORM_ID)(state);

  return {
    tutorialState: state.get("tutorial"),
    fieldValues,
    domain,
  };
};

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface OwnProps {}

export interface Props
  extends ConnectedProps,
    InjectedFormProps<SSOConfig, ConnectedProps & OwnProps>,
    WithStyles<typeof styles>,
    OwnProps {}

const fieldValidators = [ValidatorRequired, ValidateHost];

class SSOConfigFormRaw extends React.PureComponent<Props> {
  private renderButtons() {
    const { handleSubmit, initialValues, submitting } = this.props;
    const isEdit = initialValues.get!("connectors", Immutable.List())!.size! > 0 || initialValues.get!("domain") !== "";

    return (
      <>
        <CustomizedButton variant="contained" color="primary" pending={submitting} onClick={handleSubmit}>
          {isEdit ? "Update Single Sign-On Config" : "Enable Single Sign-On"}
        </CustomizedButton>
      </>
    );
  }

  private copyCallback = () => {
    copy(`https://${this.props.domain}/dex/callback`);
    this.props.dispatch(setSuccessNotificationAction("Copied successful!"));
  };

  private renderPrompt = () => {
    const { dirty, submitSucceeded } = this.props;
    return <Prompt when={dirty && !submitSucceeded} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />;
  };

  private addConnector = (type: SSO_CONNECTOR_TYPE) => {
    const { form, dispatch } = this.props;

    let connector;
    if (type === SSO_CONNECTOR_TYPE_GITLAB) {
      connector = newEmptyGitlabConnector();
    } else if (type === SSO_CONNECTOR_TYPE_GITHUB) {
      connector = newEmptyGithubConnector();
    }

    dispatch(arrayPush(form, "connectors", connector));
  };

  public render() {
    const { handleSubmit, domain, submitFailed, error } = this.props;

    return (
      <form onSubmit={handleSubmit}>
        {this.renderPrompt()}
        <KPanel
          title="Setup Domain"
          content={
            <Box p={2}>
              <Grid container spacing={2}>
                <Grid md={8} item>
                  <Field
                    name="domain"
                    label="Domain"
                    component={KRenderDebounceTextField}
                    validate={fieldValidators}
                    autoFocus
                    placeholder="Please type a domain for your Single Sign-on configuration"
                    helperText="A valid domain name is required."
                  />
                </Grid>
              </Grid>

              <Box mt={2} style={{ color: "#797979" }}>
                <Body>
                  The callback is generated based on your domain. This url is required in the following steps. Please
                  make sure your domain name has pointed to your cluster ip.
                </Body>
                <Box p={1}>
                  <pre>
                    https://<strong style={{ color: "black" }}>{domain || "<domain>"}</strong>/dex/callback
                    <Box
                      display="inline-block"
                      ml={1}
                      style={{ verticalAlign: "middle", cursor: "pointer" }}
                      onClick={this.copyCallback}
                    >
                      <CopyIconDefault fontSize="small" />
                    </Box>
                  </pre>
                </Box>
              </Box>
            </Box>
          }
        />

        <Box mt={2}>
          <KPanel
            title="Setup Identity Provider Connectors"
            content={
              <Box p={2}>
                <Box mr={2} display="inline-block">
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    endIcon={<GithubIcon />}
                    onClick={() => this.addConnector(SSO_CONNECTOR_TYPE_GITHUB)}
                  >
                    Add Github connector
                  </Button>
                </Box>
                <Box mr={2} display="inline-block">
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => this.addConnector(SSO_CONNECTOR_TYPE_GITLAB)}
                  >
                    Add Gitlab connector
                  </Button>
                </Box>
                <Body style={{ color: "#797979" }}>
                  No connector you are looking for? Fire an{" "}
                  <a href="https://github.com/kalmhq/kalm/issues/new" rel="noopener noreferrer" target="_blank">
                    issue
                  </a>{" "}
                  on kalm github. Also, pull request is well welcomed.
                </Body>
                <Connectors />
              </Box>
            }
          />
        </Box>

        {error && submitFailed ? (
          <Box pt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : null}

        <Box mt={2}>
          <Alert severity="info">
            After modifying the Single Sign-on configuration, kalm takes a few minutes to restart the corresponding
            components.
          </Alert>
        </Box>

        <Box pt={2} display="flex">
          {this.renderButtons()}
        </Box>
        {process.env.REACT_APP_DEBUG === "true" ? (
          <Box mt={2}>
            <pre style={{ maxWidth: 1500, background: "#eee" }}>
              {JSON.stringify(this.props.fieldValues as any, undefined, 2)}
            </pre>
          </Box>
        ) : null}
      </form>
    );
  }
}

export const SSOConfigForm = connect(mapStateToProps)(
  reduxForm<SSOConfig, ConnectedProps & OwnProps>({
    form: SSO_CONFIG_FORM_ID,
    initialValues: newEmptySSOConfig(),
    validate: formValidateOrNotBlockByTutorial,
    shouldError: shouldError,
    onSubmitFail: (...args) => {
      console.log("submit failed", args);
    },
  })(withStyles(styles)(SSOConfigFormRaw)),
);
