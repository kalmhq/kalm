import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { createApplicationAction } from "../../actions/application";
import ApplicationForm, { applicationInitialValues } from "../../forms/Application";
import { RootState } from "../../reducers";
import { Actions } from "../../types";
import { Application } from "../../types/application";
import { H4 } from "../../widgets/Label";
import { BasePage } from "../BasePage";
import { push } from "connected-react-router";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      height: "100%",
    },
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
      paddingLeft: 20,
    },
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ApplicationNewRaw extends React.PureComponent<Props> {
  private submit = async (applicationFormValue: Application) => {
    const { dispatch } = this.props;
    return await dispatch(createApplicationAction(applicationFormValue));
  };

  private onSubmitSuccess = (app: Application) => {
    this.props.dispatch(push(`/applications/${app.get("name")}`));
  };

  public render() {
    const { classes } = this.props;
    return (
      <BasePage
        secondHeaderRight={
          <div className={classes.secondHeaderRight}>
            <H4>Create New Application</H4>
          </div>
        }
      >
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={8} sm={8} md={8}>
              <ApplicationForm
                currentTab={"basic"}
                isEdit={false}
                initialValues={applicationInitialValues}
                onSubmit={this.submit}
                onSubmitSuccess={this.onSubmitSuccess}
              />
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const ApplicationNew = withStyles(styles)(connect()(ApplicationNewRaw));
