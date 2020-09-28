import { Box, createStyles, WithStyles, withStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { Theme } from "@material-ui/core/styles";
import { Alert } from "@material-ui/lab";
import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import arrayMutators from "final-form-arrays";
import { FormDataPreview } from "forms/Final/util";
import { Connectors } from "forms/SSOConfig/Connectors";
import React from "react";
import { Field, Form, FormRenderProps, FormSpy, FormSpyRenderProps } from "react-final-form";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import {
  newEmptyGithubConnector,
  newEmptyGitlabConnector,
  SSOConfig,
  SSO_CONNECTOR_TYPE,
  SSO_CONNECTOR_TYPE_GITHUB,
  SSO_CONNECTOR_TYPE_GITLAB,
} from "types/sso";
import { SubmitButton } from "widgets/Button";
import { CopyIconDefault, GithubIcon } from "widgets/Icon";
import { KPanel } from "widgets/KPanel";
import { Body } from "widgets/Label";
import { Prompt } from "widgets/Prompt";
import { FinalTextField } from "../Final/textfield";
import { ValidateHost } from "../validator";
import { trimAndToLowerParse } from "forms/normalizer";

const styles = (theme: Theme) =>
  createStyles({
    submitButton: {
      marginRight: theme.spacing(4),
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    tutorialState: state.tutorial,
  };
};

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface OwnProps {
  onSubmit: any;
  initial: SSOConfig;
}

export interface Props extends ConnectedProps, WithStyles<typeof styles>, OwnProps {}

class SSOConfigFormRaw extends React.PureComponent<Props> {
  private renderButtons(initialValues: SSOConfig, submitting: boolean) {
    const isEdit = (initialValues.connectors && initialValues.connectors?.length > 0) || initialValues.domain !== "";

    return (
      <>
        <SubmitButton>{isEdit ? "Update Single Sign-On Config" : "Enable Single Sign-On"}</SubmitButton>
      </>
    );
  }

  private copyCallback = (domain?: string) => {
    copy(`https://${domain}/dex/callback`);
    this.props.dispatch(setSuccessNotificationAction("Copied successful!"));
  };

  private addConnector = (type: SSO_CONNECTOR_TYPE, values: SSOConfig, change: any) => {
    let connector;
    if (type === SSO_CONNECTOR_TYPE_GITLAB) {
      connector = newEmptyGitlabConnector();
    } else if (type === SSO_CONNECTOR_TYPE_GITHUB) {
      connector = newEmptyGithubConnector();
    }

    change(
      "connectors",
      values.connectors && values.connectors.length > 0 ? [...values.connectors, connector] : [connector],
    );
  };

  public render() {
    const { initial, onSubmit } = this.props;

    return (
      <Form
        initialValues={initial}
        onSubmit={onSubmit}
        subscription={{ submitting: true, pristine: true }}
        keepDirtyOnReinitialize
        mutators={{
          ...arrayMutators,
        }}
        render={({ handleSubmit, submitting }: FormRenderProps<SSOConfig>) => (
          <form onSubmit={handleSubmit}>
            <Prompt />
            <KPanel
              title="Setup Domain"
              content={
                <Box p={2}>
                  <Grid container spacing={2}>
                    <Grid md={8} item>
                      <Field
                        name="domain"
                        label="Domain"
                        component={FinalTextField}
                        validate={ValidateHost}
                        parse={trimAndToLowerParse}
                        autoFocus
                        placeholder="Please type a domain for your Single Sign-on configuration"
                        helperText="A valid domain name is required."
                      />
                    </Grid>
                  </Grid>

                  <Box mt={2} style={{ color: "#797979" }}>
                    <Body>
                      The callback is generated based on your domain. This url is required in the following steps.
                      Please make sure your domain name has pointed to your cluster ip.
                    </Body>
                    <Box p={1}>
                      <pre>
                        <FormSpy subscription={{ values: true }}>
                          {({ values }: FormSpyRenderProps<SSOConfig>) => (
                            <>
                              https://<strong style={{ color: "black" }}>{values.domain || "<domain>"}</strong>
                              /dex/callback
                              <Box
                                display="inline-block"
                                ml={1}
                                style={{ verticalAlign: "middle", cursor: "pointer" }}
                                onClick={() => this.copyCallback(values.domain)}
                              >
                                <CopyIconDefault fontSize="small" />
                              </Box>
                            </>
                          )}
                        </FormSpy>
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
                    <FormSpy subscription={{ values: true }}>
                      {({ values, form: { change } }: FormSpyRenderProps<SSOConfig>) => {
                        return (
                          <>
                            <Box mr={2} display="inline-block">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                endIcon={<GithubIcon />}
                                onClick={() => this.addConnector(SSO_CONNECTOR_TYPE_GITHUB, values, change)}
                              >
                                Add Github connector
                              </Button>
                            </Box>
                            <Box mr={2} display="inline-block">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => this.addConnector(SSO_CONNECTOR_TYPE_GITLAB, values, change)}
                              >
                                Add Gitlab connector
                              </Button>
                            </Box>
                          </>
                        );
                      }}
                    </FormSpy>
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
              {this.renderButtons(initial, submitting)}
            </Box>
            <FormDataPreview />
          </form>
        )}
      />
    );
  }
}

export const SSOConfigForm = connect(mapStateToProps)(withStyles(styles)(SSOConfigFormRaw));
