import { Box, createStyles, WithStyles, withStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { Theme } from "@material-ui/core/styles";
import { Alert } from "@material-ui/lab";
import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import { Field, Form, FormikProps, withFormik } from "formik";
import { Connectors } from "forms/SSOConfig/Connectors";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { formikValidateOrNotBlockByTutorial } from "tutorials/utils";
import { TDispatchProp } from "types";
import {
  newEmptyGithubConnector,
  newEmptyGitlabConnector,
  SSOConfigFormType,
  SSO_CONNECTOR_TYPE,
  SSO_CONNECTOR_TYPE_GITHUB,
  SSO_CONNECTOR_TYPE_GITLAB,
} from "types/sso";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { CopyIconDefault, GithubIcon } from "widgets/Icon";
import { KPanel } from "widgets/KPanel";
import { Body } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import { KRenderDebounceFormikTextField } from "../Basic/textfield";
import { ValidateHost } from "../validator";

const styles = (theme: Theme) =>
  createStyles({
    submitButton: {
      marginRight: theme.spacing(4),
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    tutorialState: state.get("tutorial"),
  };
};

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface OwnProps {
  onSubmit: any;
  initial: SSOConfigFormType;
}

export interface Props extends ConnectedProps, FormikProps<SSOConfigFormType>, WithStyles<typeof styles>, OwnProps {}

class SSOConfigFormRaw extends React.PureComponent<Props> {
  private renderButtons() {
    const { initialValues, isSubmitting } = this.props;
    const isEdit = (initialValues.connectors && initialValues.connectors?.length > 0) || initialValues.domain !== "";

    return (
      <>
        <CustomizedButton variant="contained" color="primary" pending={isSubmitting} type="submit">
          {isEdit ? "Update Single Sign-On Config" : "Enable Single Sign-On"}
        </CustomizedButton>
      </>
    );
  }

  private copyCallback = () => {
    copy(`https://${this.props.values.domain}/dex/callback`);
    this.props.dispatch(setSuccessNotificationAction("Copied successful!"));
  };

  private renderPrompt = () => {
    const { dirty, isSubmitting } = this.props;
    return <Prompt when={dirty && !isSubmitting} message={sc.CONFIRM_LEAVE_WITHOUT_SAVING} />;
  };

  private addConnector = (type: SSO_CONNECTOR_TYPE) => {
    const { values, setFieldValue } = this.props;

    let connector;
    if (type === SSO_CONNECTOR_TYPE_GITLAB) {
      connector = newEmptyGitlabConnector();
    } else if (type === SSO_CONNECTOR_TYPE_GITHUB) {
      connector = newEmptyGithubConnector();
    }

    setFieldValue(
      "connectors",
      values.connectors && values.connectors.length > 0 ? [...values.connectors, connector] : [connector],
    );
  };

  public render() {
    const { values } = this.props;

    return (
      <Form>
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
                    component={KRenderDebounceFormikTextField}
                    validate={ValidateHost}
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
                    https://<strong style={{ color: "black" }}>{values.domain || "<domain>"}</strong>/dex/callback
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
                <Connectors connectors={values.connectors} />
              </Box>
            }
          />
        </Box>

        {/* {error && submitFailed ? (
          <Box pt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : null} */}

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
            <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values as any, undefined, 2)}</pre>
          </Box>
        ) : null}
      </Form>
    );
  }
}

const connectedForm = connect(mapStateToProps)(withStyles(styles)(SSOConfigFormRaw));

export const SSOConfigForm = withFormik<OwnProps, SSOConfigFormType>({
  mapPropsToValues: (props) => {
    return props.initial;
  },
  // @ts-ignore
  validate: formikValidateOrNotBlockByTutorial,
  handleSubmit: async (formValues, { props: { onSubmit } }) => {
    await onSubmit(formValues);
  },
})(connectedForm);
