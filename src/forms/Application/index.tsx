import {
  Button,
  Grid,
  Paper,
  WithStyles,
  createStyles,
  withStyles
} from "@material-ui/core";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { InjectedFormProps } from "redux-form";
import { FieldArray, reduxForm, formValueSelector } from "redux-form/immutable";
import {
  ComponentFormValues,
  ApplicationFormValues,
  SharedEnv
} from "../../actions";
import { CustomTextField } from "../Basic";
import { ValidatorRequired } from "../validator";
import { Components } from "./component";
import { RenderSharedEnvs, EnvTypeExternal } from "../Basic/env";
import { PropType } from "../../typings";
import { RootState } from "../../reducers";
import { connect } from "react-redux";
import Immutable from "immutable";
import { render } from "@testing-library/react";

const styles = (theme: Theme) =>
  createStyles({
    sectionHeader: {
      fontSize: 24,
      fontWeight: 400
    },
    sectionDiscription: {
      fontSize: 16,
      margin: "16px 0"
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(5)
    }
  });

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector("application");
  const formComponents: ComponentFormValues[] = selector(state, "components");
  const sharedEnv: SharedEnv[] = selector(state, "sharedEnv");

  return {
    sharedEnv,
    formComponents
  };
};

export interface Props {}

class ApplicationFormRaw extends React.PureComponent<
  Props &
    InjectedFormProps<ApplicationFormValues, Props> &
    ReturnType<typeof mapStateToProps> &
    WithStyles<typeof styles>
> {
  public render() {
    const { sharedEnv, handleSubmit, formComponents, classes } = this.props;
    const isEnvInSharedEnv = (envName: string) => {
      return !!sharedEnv.find(x => x.get("name") === envName);
    };

    const missingVariables = Array.from(
      new Set(
        formComponents
          .map(component => {
            return component
              .get("env")
              .filter(env => env.get("type") === EnvTypeExternal)
              .map(env => env.get("name"));
          })
          .reduce((acc, item) => acc.concat(item))
      )
    ).filter(x => !isEnvInSharedEnv(x));

    return (
      <div>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={12} md={8} lg={8} xl={6}>
              <Typography
                variant="h2"
                classes={{
                  root: classes.sectionHeader
                }}
              >
                Basic
              </Typography>
              <Typography classes={{ root: classes.sectionDiscription }}>
                Basic information of this application
              </Typography>
              <Paper
                elevation={4}
                square
                classes={{
                  root: classes.paper
                }}
              >
                <CustomTextField
                  name="name"
                  label="Name"
                  margin
                  validate={ValidatorRequired}
                  helperText='The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
                  placeholder="Please type the component name"
                />
              </Paper>

              <Typography
                variant="h2"
                classes={{
                  root: classes.sectionHeader
                }}
              >
                Components
              </Typography>
              <Typography classes={{ root: classes.sectionDiscription }}>
                Select compoents you want to include into this application.
              </Typography>
              <Paper
                elevation={4}
                square
                classes={{
                  root: classes.paper
                }}
              >
                <Components />
              </Paper>

              <Typography
                variant="h2"
                classes={{
                  root: classes.sectionHeader
                }}
              >
                Shared Environment Variables
              </Typography>
              <Typography classes={{ root: classes.sectionDiscription }}>
                Shared environment variable is consistent amoung all components.
              </Typography>
              <Paper
                elevation={4}
                square
                classes={{
                  root: classes.paper
                }}
              >
                <FieldArray
                  name="sharedEnv"
                  valid={true}
                  component={RenderSharedEnvs}
                  missingVariables={missingVariables}
                />
              </Paper>
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

const initialValues: ApplicationFormValues = Immutable.fromJS({
  id: "0",
  name: "a-sample-application",
  sharedEnv: [],
  components: []
});

export default reduxForm<ApplicationFormValues, Props>({
  form: "application",
  initialValues,
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  }
})(connect(mapStateToProps)(withStyles(styles)(ApplicationFormRaw)));
