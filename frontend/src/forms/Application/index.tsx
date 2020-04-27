import { createStyles, Grid, Paper, WithStyles, withStyles, Button } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, getFormValues, reduxForm } from "redux-form/immutable";
import { TableTitle } from "widgets/TableTitle";
import { RootState } from "../../reducers";
import { Application, SharedEnv } from "../../types/application";
import { ComponentTemplate } from "../../types/componentTemplate";
import { SwitchField } from "../Basic/switch";
import { TextField } from "../Basic/text";
import { NormalizeBoolean } from "../normalizer";
import { ValidatorName, ValidatorRequired } from "../validator";
import { SharedEnvs } from "./sharedEnv";

const styles = (theme: Theme) =>
  createStyles({
    formSection: {
      padding: theme.spacing(2),
      margin: theme.spacing(3)
    },
    formSectionTable: {
      padding: theme.spacing(0),
      margin: theme.spacing(3)
    },
    formSectionContainer: {
      margin: "0",
      width: "auto"
    },
    formSectionItem: {
      padding: "0px !important"
    },
    displayNone: {
      display: "none"
    },
    submitButton: {
      marginLeft: 20
    }
  });

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector("application");
  const formComponents: ComponentTemplate[] = selector(state, "components");
  const sharedEnvs: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");
  const values = getFormValues("application")(state) as Application;

  return {
    sharedEnvs,
    formComponents,
    values
  };
};

export interface Props {
  isEdit?: boolean;
  currentTab: "basic" | "sharedEnvs";
}

class ApplicationFormRaw extends React.PureComponent<
  Props &
    InjectedFormProps<Application, Props> &
    ReturnType<typeof mapStateToProps> &
    WithStyles<typeof styles> &
    DispatchProp
> {
  private renderBasic() {
    const { isEdit } = this.props;
    return (
      <>
        {TableTitle("Basic Info")}
        <Grid container spacing={2}>
          <Grid item md={6}>
            <Field
              name="name"
              label="Name"
              disabled={isEdit}
              component={TextField}
              validate={[ValidatorRequired, ValidatorName]}
              helperText={
                isEdit
                  ? "Can't modify name"
                  : 'The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
              }
              placeholder="Please type the component name"
            />
          </Grid>
          <Grid item md={6}>
            <Field
              name="isActive"
              formControlLabelProps={{
                label: "Active"
              }}
              component={SwitchField}
              normalizer={NormalizeBoolean}
            />
          </Grid>
        </Grid>
      </>
    );
  }

  // private renderComponent() {
  //   return (
  //     <>
  //       <Components />
  //     </>
  //   );
  // }

  private renderSharedEnvs() {
    return (
      <>
        <SharedEnvs />
      </>
    );
  }

  public render() {
    const { handleSubmit, classes, currentTab } = this.props;

    return (
      <form onSubmit={handleSubmit} style={{ height: "100%", overflow: "hidden" }}>
        <Grid
          container
          spacing={2}
          className={`${classes.formSectionContainer} ${currentTab === "basic" ? "" : classes.displayNone}`}>
          <Grid className={classes.formSectionItem} item xs={12} sm={8} md={8}>
            <Paper className={classes.formSection}>{this.renderBasic()}</Paper>
          </Grid>
        </Grid>

        <Paper className={`${classes.formSectionContainer} ${currentTab === "sharedEnvs" ? "" : classes.displayNone}`}>
          {this.renderSharedEnvs()}
        </Paper>

        <Button
          variant="contained"
          color="primary"
          type="submit"
          className={`${currentTab === "basic" ? classes.submitButton : classes.displayNone}`}>
          Create
        </Button>
      </form>
    );
  }
}

export const applicationInitialValues: Application = Immutable.fromJS({
  name: "",
  sharedEnvs: [],
  components: []
});

export default reduxForm<Application, Props>({
  form: "application",
  initialValues: applicationInitialValues,
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  }
})(connect(mapStateToProps)(withStyles(styles)(ApplicationFormRaw)));
