import { Box, createStyles, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { Field, formValueSelector, reduxForm } from "redux-form/immutable";
import { RootState } from "reducers";
import { Application, SharedEnv } from "types/application";
import { CustomizedButton } from "widgets/Button";
import { KPanel } from "widgets/KPanel";
import { KRenderTextField } from "../Basic/textfield";
import { ValidatorName, ValidatorRequired } from "../validator";
import { Alert } from "@material-ui/lab";
import { shouldError } from "forms/common";
import { formValidateOrNotBlockByTutorial } from "tutorials/utils";
import { InjectedFormProps } from "redux-form";
import { APPLICATION_FORM_ID } from "../formIDs";
import { Body } from "widgets/Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // height: "100%",
      // overflow: "hidden",
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
  const selector = formValueSelector(APPLICATION_FORM_ID);
  const sharedEnvs: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");
  const name = selector(state, "name") as string;

  return {
    tutorialState: state.get("tutorial"),
    isSubmittingApplication: state.get("applications").get("isSubmittingApplication"),
    name,
    sharedEnvs,
  };
};

interface OwnProps {
  isEdit?: boolean;
  currentTab: "basic" | "sharedEnvs" | "applicationPlugins";
}

interface ConnectedProps extends ReturnType<typeof mapStateToProps>, DispatchProp {}

export interface Props
  extends ConnectedProps,
    InjectedFormProps<Application, ConnectedProps & OwnProps>,
    WithStyles<typeof styles>,
    OwnProps {}

class ApplicationFormRaw extends React.PureComponent<Props> {
  private renderBasic() {
    const { isEdit, name } = this.props;
    return (
      <>
        <Field
          name="name"
          label="Name"
          disabled={isEdit}
          component={KRenderTextField}
          validate={[ValidatorRequired, ValidatorName]}
          helperText={
            isEdit
              ? "Can't modify name"
              : 'The characters allowed in names are: digits (0-9), lower case letters (a-z), and "-". Max length is 180.'
          }
          placeholder="Please type the component name"
        />

        <Box mt={2} style={{ color: "#797979" }}>
          <Body>
            Workloads in Kalm can access each other via auto-generated DNS name. Application name will be a part of the
            DNS names of its children resources.
          </Body>
          <Box p={1}>
            <code id="application-name-code">
              {"<COMPONENT_NAME>"}.<strong style={{ color: "black" }}>{name || "<APPLICATION_NAME_HERE>"}</strong>
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
          onClick={(event) => {
            handleSubmit(event);
          }}
          id="add-application-submit-button"
        >
          Create Application
        </CustomizedButton>
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
  reduxForm<Application, ConnectedProps & OwnProps>({
    form: APPLICATION_FORM_ID,
    initialValues: applicationInitialValues,
    validate: formValidateOrNotBlockByTutorial,
    shouldError: shouldError,
    onSubmitFail: (...args) => {
      console.log("submit failed", args);
    },
  })(withStyles(styles)(ApplicationFormRaw)),
);
