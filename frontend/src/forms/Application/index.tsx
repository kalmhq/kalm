import { Box, createStyles, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, getFormValues, reduxForm } from "redux-form/immutable";
import { RootState } from "../../reducers";
import { Application, SharedEnv } from "../../types/application";
import { ComponentTemplate } from "../../types/componentTemplate";
import { CustomizedButton } from "../../widgets/Button";
import { KPanel } from "../../widgets/KPanel";
import { KRenderTextField } from "../Basic/textfield";
import { ValidatorName, ValidatorRequired } from "../validator";
import { formValidatOrNotBlockByTutorial } from "types/tutorial";
import { Alert } from "@material-ui/lab";
import { shouldError } from "forms/common";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // height: "100%",
      // overflow: "hidden",
      background: "#fff",
      padding: 20,
    },
    // formSection: {
    //   padding: theme.spacing(2),
    //   margin: theme.spacing(3)
    // },
    // formSectionTable: {
    //   padding: theme.spacing(0),
    //   margin: theme.spacing(3)
    // },
    // formSectionContainer: {
    //   margin: "0",
    //   width: "auto"
    // },
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
  const selector = formValueSelector("application");
  const formComponents: ComponentTemplate[] = selector(state, "components");
  const sharedEnvs: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");
  const values = getFormValues("application")(state) as Application;

  return {
    tutorialState: state.get("tutorial"),
    isSubmittingApplication: state.get("applications").get("isSubmittingApplication"),
    sharedEnvs,
    formComponents,
    values,
  };
};

export interface Props extends ReturnType<typeof mapStateToProps>, DispatchProp {
  isEdit?: boolean;
  currentTab: "basic" | "sharedEnvs" | "applicationPlugins";
}

class ApplicationFormRaw extends React.PureComponent<
  Props & InjectedFormProps<Application, Props> & WithStyles<typeof styles>
> {
  private renderBasic() {
    const { isEdit } = this.props;
    return (
      <Field
        name="name"
        label="Name"
        disabled={isEdit}
        component={KRenderTextField}
        validate={[ValidatorRequired, ValidatorName]}
        helperText={
          isEdit
            ? "Can't modify name"
            : 'The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
        }
        placeholder="Please type the component name"
      />
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
          onClick={event => {
            handleSubmit(event);
          }}>
          Submit
        </CustomizedButton>
        {/* <CustomizedButton
          pending={isSubmittingApplication && !values.get("nextAddComponent")}
          disabled={isSubmittingApplication && values.get("nextAddComponent")}
          variant="contained"
          className={`${currentTab === "basic" ? "" : classes.displayNone}`}
          onClick={event => {
            change("nextAddComponent", false);
            setTimeout(() => {
              handleSubmit(event);
            }, 200);
          }}>
          Save And Back
        </CustomizedButton> */}
      </>
    );
  }

  public render() {
    const { handleSubmit, classes, submitFailed, error } = this.props;

    return (
      <form onSubmit={handleSubmit} className={classes.root} tutorial-anchor-id="application-form">
        <KPanel
          title={"Application Basic"}
          content={
            <Box p={2} tutorial-anchor-id="application-form-name-field">
              {this.renderBasic()}
            </Box>
          }
        />

        {error && submitFailed ? (
          <Box pt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : null}

        <Box pt={3} className={classes.displayFlex}>
          {this.renderButtons()}
        </Box>

        {/*
        <Grid
          container
          spacing={2}
          className={`${classes.formSectionContainer} ${currentTab === "sharedEnvs" ? "" : classes.displayNone}`}>
          <Grid item xs={12} sm={12} md={12}>
            <SectionTitle>
              <H5>Shared Environments</H5>
            </SectionTitle>
          </Grid>
          <Grid item xs={12} sm={12} md={12}>
            <SharedEnvs />
          </Grid>
        </Grid>

        <Grid
          container
          spacing={2}
          className={`${classes.formSectionContainer} ${
            currentTab === "applicationPlugins" ? "" : classes.displayNone
          }`}>
          <Grid item xs={12} sm={12} md={12}>
            <SectionTitle>
              <H5>Application Plugins</H5>
            </SectionTitle>
          </Grid>
          <Grid item xs={12} sm={12} md={12}>
            <Plugins />
          </Grid>
        </Grid> */}
      </form>
    );
  }
}

export const applicationInitialValues: Application = Immutable.fromJS({
  name: "",
  sharedEnvs: [],
  components: [],
});

export default connect(mapStateToProps)(
  reduxForm<Application, Props>({
    form: "application",
    initialValues: applicationInitialValues,
    validate: formValidatOrNotBlockByTutorial,
    shouldError: shouldError,
    onSubmitFail: (...args) => {
      console.log("submit failed", args);
    },
  })(withStyles(styles)(ApplicationFormRaw)),
);
