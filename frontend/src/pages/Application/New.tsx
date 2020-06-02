import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
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

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
      height: "100%"
    },
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
      paddingLeft: 20
    }
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ApplicationNewRaw extends React.PureComponent<Props> {
  private submit = async (applicationFormValue: Application) => {
    const { dispatch } = this.props;
    await dispatch(createApplicationAction(applicationFormValue));

    if (applicationFormValue.get("nextAddComponent")) {
      dispatch(push(`/applications/${applicationFormValue.get("name")}/edit`));
    } else {
      dispatch(push(`/applications`));
    }
  };

  public render() {
    const { classes } = this.props;
    return (
      <BasePage
        secondHeaderRight={
          <div className={classes.secondHeaderRight}>
            <H4>New Application</H4>
          </div>
        }>
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={8} sm={8} md={8}>
              <ApplicationForm
                onSubmit={this.submit}
                isEdit={false}
                initialValues={applicationInitialValues}
                currentTab={"basic"}
              />
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const ApplicationNew = withStyles(styles)(connect()(ApplicationNewRaw));
