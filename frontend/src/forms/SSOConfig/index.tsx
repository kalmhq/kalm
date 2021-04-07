import { Box, createStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { Alert } from "@material-ui/lab";
import { setSuccessNotificationAction } from "actions/notification";
import copy from "copy-to-clipboard";
import arrayMutators from "final-form-arrays";
import { FormDataPreview } from "forms/Final/util";
import { trimAndToLowerParse } from "forms/normalizer";
import { Connectors } from "forms/SSOConfig/Connectors";
import React from "react";
import { Field, Form, FormRenderProps, FormSpy, FormSpyRenderProps } from "react-final-form";
import { useDispatch } from "react-redux";
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
import { KMLink } from "widgets/Link";
import { Prompt } from "widgets/Prompt";
import { FinalTextField } from "../Final/textfield";
import { ValidateHost } from "../validator";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    submitButton: {
      marginRight: theme.spacing(4),
    },
    secondaryText: {
      color: theme.palette.grey[600],
    },
    inlineHelperText: {
      color: theme.palette.grey[500],
    },
  }),
);

interface OwnProps {
  onSubmit: any;
  initial: SSOConfig;
}

interface Props extends OwnProps {}

const SSOConfigFormRaw: React.FC<Props> = (props) => {
  const classes = useStyles();
  const { initial, onSubmit } = props;
  const dispatch = useDispatch();

  const renderButtons = (initialValues: SSOConfig, submitting: boolean) => {
    const isEdit = (initialValues.connectors && initialValues.connectors?.length > 0) || initialValues.domain !== "";

    return (
      <>
        <SubmitButton>{isEdit ? "Update Single Sign-On Config" : "Enable Single Sign-On"}</SubmitButton>
      </>
    );
  };

  const copyCallback = (domain?: string) => {
    copy(`https://${domain}/dex/callback`);
    dispatch(setSuccessNotificationAction("Copied successful!"));
  };

  const addConnector = (type: SSO_CONNECTOR_TYPE, values: SSOConfig, change: any) => {
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

                <Box mt={2} className={classes.inlineHelperText}>
                  The callback is generated based on your domain. This url is required in the following steps. Please
                  make sure your domain name has pointed to your cluster ip.
                </Box>
                <Box pl={2} pt={1} className={classes.secondaryText}>
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
                            onClick={() => copyCallback(values.domain)}
                          >
                            <CopyIconDefault fontSize="small" />
                          </Box>
                        </>
                      )}
                    </FormSpy>
                  </pre>
                </Box>
              </Box>
            }
          />

          <Box mt={2}>
            <KPanel title="Setup Identity Provider Connectors">
              <Box p={2}>
                <Connectors />
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
                            onClick={() => addConnector(SSO_CONNECTOR_TYPE_GITHUB, values, change)}
                          >
                            Add Github connector
                          </Button>
                        </Box>
                        <Box mr={2} display="inline-block">
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => addConnector(SSO_CONNECTOR_TYPE_GITLAB, values, change)}
                          >
                            Add Gitlab connector
                          </Button>
                        </Box>
                      </>
                    );
                  }}
                </FormSpy>
                <Box pt={2} className={classes.inlineHelperText}>
                  No connector you are looking for? Fire an{" "}
                  <KMLink href="https://github.com/kalmhq/kalm/issues/new" rel="noopener noreferrer" target="_blank">
                    issue
                  </KMLink>{" "}
                  on kalm github. Also, pull request is well welcomed.
                </Box>
              </Box>
            </KPanel>
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
            {renderButtons(initial, submitting)}
          </Box>
          <FormDataPreview />
        </form>
      )}
    />
  );
};

export const SSOConfigForm = SSOConfigFormRaw;
