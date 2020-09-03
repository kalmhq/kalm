import { Box, createStyles, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import { Alert } from "@material-ui/lab";
import { createApplicationAction } from "actions/application";
import { push } from "connected-react-router";
import { Field, FormikProps, withFormik } from "formik";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { theme } from "theme/theme";
import { TDispatchProp } from "types";
import { ApplicationContent } from "types/application";
import stringConstants from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { Body } from "widgets/Label";
import { KRenderDebounceFormikTextField } from "../Basic/textfield";
import { ValidatorName } from "../validator";
import { APPLICATION_FORM_ID } from "forms/formIDs";
import { formikValidateOrNotBlockByTutorial } from "tutorials/utils";
import { FormMidware } from "tutorials/formMidware";

const styles = (theme: Theme) =>
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
  });

const mapStateToProps = (state: RootState) => {
  return {
    tutorialState: state.get("tutorial"),
    isSubmittingApplication: state.get("applications").get("isSubmittingApplication"),
    form: APPLICATION_FORM_ID,
  };
};

interface OwnProps {
  isEdit?: boolean;
  currentTab: "basic" | "applicationPlugins";
}

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, TDispatchProp {}

export interface Props extends ConnectedProps, FormikProps<ApplicationContent>, WithStyles<typeof styles>, OwnProps {}

class ApplicationFormRaw extends React.PureComponent<Props> {
  private renderBasic() {
    const { isEdit, values } = this.props;
    return (
      <>
        <Field
          name="name"
          label="App Name"
          id="application-name"
          disabled={isEdit}
          component={KRenderDebounceFormikTextField}
          autoFocus={true}
          validate={ValidatorName}
          helperText={isEdit ? "Can't modify name" : stringConstants.NAME_RULE}
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
      </>
    );
  }

  private renderButtons() {
    const { handleSubmit, classes, currentTab, isSubmittingApplication } = this.props;

    return (
      <>
        <CustomizedButton
          pending={isSubmittingApplication}
          disabled={isSubmittingApplication}
          tutorial-anchor-id="application-form-submit-button"
          variant="contained"
          color="primary"
          className={`${currentTab === "basic" ? classes.submitButton : classes.displayNone}`}
          onClick={(event: any) => {
            handleSubmit(event);
          }}
          id="add-application-submit-button"
        >
          Create App
        </CustomizedButton>
      </>
    );
  }

  public render() {
    const { handleSubmit, classes, errors, touched, values, form } = this.props;

    return (
      <form onSubmit={handleSubmit} className={classes.root} tutorial-anchor-id="application-form">
        <FormMidware values={values} form={form} />
        <KPanel
          content={
            <Box p={2} tutorial-anchor-id="application-form-name-field">
              {this.renderBasic()}
            </Box>
          }
        />

        {errors.name && touched.name ? (
          <Box pt={2}>
            <Alert severity="error">{errors.name}</Alert>
          </Box>
        ) : null}

        <Box pt={3} className={classes.displayFlex}>
          {this.renderButtons()}
        </Box>
      </form>
    );
  }
}

const form = withFormik<ConnectedProps & OwnProps & WithStyles<typeof styles>, ApplicationContent>({
  mapPropsToValues: () => ({ name: "" }),
  handleSubmit: async (applicationFormValue, { props: { dispatch } }) => {
    await dispatch(createApplicationAction(Immutable.fromJS(applicationFormValue)));
    dispatch(push(`/applications/${applicationFormValue.name}/components/new`));
  },
  validate: formikValidateOrNotBlockByTutorial,
})(ApplicationFormRaw);

export default connect(mapStateToProps)(withStyles(styles)(form));
