import { Box, createStyles } from "@material-ui/core";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { setSuccessNotificationAction } from "actions/notification";
import { createResource } from "api";
import { kalmToK8sNamespace } from "api/transformers";
import { FinalTextField } from "forms/Final/textfield";
import { FormDataPreview } from "forms/Final/util";
import { APPLICATION_FORM_ID } from "forms/formIDs";
import { trimAndToLowerParse } from "forms/normalizer";
import React from "react";
import { Field, Form, FormRenderProps } from "react-final-form";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import { RootState } from "store";
import { theme } from "theme/theme";
import { FormTutorialHelper } from "tutorials/formValueToReduxStoreListener";
import { finalValidateOrNotBlockByTutorial } from "tutorials/utils";
import { Application } from "types/application";
import { SubmitButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Body } from "widgets/Label";
import { ValidatorIsDNS123Label } from "../validator";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: 20,
    },
    displayNone: {
      display: "none",
    },
    displayFlex: {
      display: "flex",
    },
    buttons: {
      margin: "20px 0 0",
    },
    submitButton: {
      marginRight: theme.spacing(4),
    },
  }),
);

interface Props {}

const ApplicationForm: React.FC<Props> = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const { tutorialState, form } = useSelector((state: RootState) => {
    return {
      tutorialState: state.tutorial,
      form: APPLICATION_FORM_ID,
    };
  });

  const onSubmit = async (applicationFormValue: Application) => {
    await createResource(kalmToK8sNamespace(applicationFormValue));
    dispatch(setSuccessNotificationAction("Create application successfully"));
    history.push(`/applications/${applicationFormValue.name}/components/new`);
  };

  return (
    <Form
      initialValues={{ name: "" }}
      onSubmit={onSubmit}
      keepDirtyOnReinitialize
      validate={(values) => finalValidateOrNotBlockByTutorial(values, tutorialState, form)}
      render={({ handleSubmit, values }: FormRenderProps<Application>) => (
        <form onSubmit={handleSubmit} className={classes.root} tutorial-anchor-id="application-form">
          <FormTutorialHelper form={form} />
          <KPanel
            content={
              <Box p={2} tutorial-anchor-id="application-form-name-field">
                <Field
                  name="name"
                  label="App Name"
                  id="application-name"
                  component={FinalTextField}
                  autoFocus
                  validate={ValidatorIsDNS123Label}
                  parse={trimAndToLowerParse}
                  placeholder="e.g. my-application; production"
                  helperText="Must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character"
                />

                <Box mt={2} style={{ color: theme.palette.text.secondary }}>
                  <Body>The App Name becomes part of the DNS name for its resources:</Body>
                  <Box p={1}>
                    <code id="application-name-code">
                      {"<COMPONENT_NAME>"}.
                      <strong style={{ color: theme.palette.text.primary }}>{values.name || "<APP_NAME>"}</strong>
                      .svc.cluster.local
                    </code>
                  </Box>
                </Box>
              </Box>
            }
          />

          <FormDataPreview />

          <Box pt={3} className={classes.displayFlex}>
            <SubmitButton
              tutorial-anchor-id="application-form-submit-button"
              className={`${classes.submitButton}`}
              id="add-application-submit-button"
            >
              Create App
            </SubmitButton>
          </Box>
        </form>
      )}
    />
  );
};

export default ApplicationForm;
