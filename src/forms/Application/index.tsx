import { Button, createStyles, Grid, Paper, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, getFormValues, reduxForm } from "redux-form/immutable";
import { Application, ComponentTemplate, SharedEnv } from "../../actions";
import { RootState } from "../../reducers";
import { HelperContainer } from "../../widgets/Helper";
import { SwitchField } from "../Basic/switch";
import { TextField } from "../Basic/text";
import { NormalizeBoolean } from "../normalizer";
import { ValidatorRequired } from "../validator";
import { Components } from "./component";
import { SharedEnvs } from "./shardEnv";

const styles = (theme: Theme) =>
  createStyles({
    sectionHeader: {
      fontSize: 24,
      fontWeight: 400,
      margin: "16px 0"
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(5)
    }
  });

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector("application");
  const formComponents: ComponentTemplate[] = selector(state, "components");
  const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnv");
  const values = getFormValues("application")(state) as Application;

  return {
    sharedEnv,
    formComponents,
    values
  };
};

export interface Props {}

class ApplicationFormRaw extends React.PureComponent<
  Props & InjectedFormProps<Application, Props> & ReturnType<typeof mapStateToProps> & WithStyles<typeof styles>
> {
  private getIsEdit() {
    return !!this.props.values.get("resourceVersion");
  }

  private renderBaisc() {
    const { classes } = this.props;
    const isEdit = this.getIsEdit();
    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Basic
        </Typography>
        <HelperContainer>
          <Typography>Basic information of this application</Typography>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <Grid container spacing={2}>
            <Grid item md={6}>
              <Field
                name="name"
                label="Name"
                disabled={isEdit}
                component={TextField}
                validate={ValidatorRequired}
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
                name="namespace"
                label="Namespace"
                disabled={isEdit}
                component={TextField}
                validate={ValidatorRequired}
                helperText={isEdit ? "Can't modify namespace" : "All resources will running in this namespace."}
                placeholder="Please type the namespace"
              />
            </Grid>
          </Grid>
          <div>
            <Field
              name="isPersistent"
              formControlLabelProps={{
                label: "Persistent"
              }}
              disabled={isEdit}
              component={SwitchField}
              normalizer={NormalizeBoolean}
              tooltipProps={{
                title:
                  "This option controls how disks are mounted. " +
                  "If true, the system will use persistent disks as you defined. Data won't lost during restart. It's suitable for a production deployment." +
                  "If false, it will use temporary disks, data will be lost during a restart. You should only use this mode in test case."
              }}
            />
          </div>
          <Field
            name="isActive"
            formControlLabelProps={{
              label: "Active"
            }}
            component={SwitchField}
            normalizer={NormalizeBoolean}
          />
        </Paper>
      </>
    );
  }

  private renderComponent() {
    const { classes } = this.props;

    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Components
        </Typography>
        <HelperContainer>
          <Typography>Select compoents you want to include into this application.</Typography>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <Components />
        </Paper>
      </>
    );
  }

  private renderSharedEnvs() {
    const { classes } = this.props;

    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Shared Environment Variables
        </Typography>
        <HelperContainer>
          <Typography>Shared environment variable is consistent amoung all components.</Typography>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <SharedEnvs />
        </Paper>
      </>
    );
  }

  public render() {
    const { handleSubmit } = this.props;

    return (
      <div>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={12} md={8} lg={8} xl={6}>
              {this.renderBaisc()}
              {this.renderComponent()}
              {this.renderSharedEnvs()}
            </Grid>
          </Grid>
          <Button variant="contained" color="primary" type="submit">
            Submit
          </Button>
        </form>
      </div>
    );
  }
}

const initialValues: Application = Immutable.fromJS({
  id: "0",
  name: "a-sample-application",
  sharedEnv: [],
  components: []
});

export default reduxForm<Application, Props>({
  form: "application",
  initialValues,
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  }
})(connect(mapStateToProps)(withStyles(styles)(ApplicationFormRaw)));
