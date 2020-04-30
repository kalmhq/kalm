import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { createApplicationAction } from "../../actions/application";
import ApplicationForm, { applicationInitialValues } from "../../forms/Application";
import { RootState } from "../../reducers";
import { getCurrentNamespace } from "../../selectors/namespace";
import { Actions } from "../../types";
import { Application } from "../../types/application";
import { BasePage } from "../BasePage";
import { H4 } from "../../widgets/Label";
import { push } from "connected-react-router";

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

    dispatch(push(`/applications/${applicationFormValue.get("name")}/edit`));
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
          <ApplicationForm
            onSubmit={this.submit}
            isEdit={false}
            initialValues={applicationInitialValues.set("namespace", getCurrentNamespace())}
            currentTab={"basic"}
          />
        </div>
      </BasePage>
    );
  }
}

export const ApplicationNew = withStyles(styles)(connect()(ApplicationNewRaw));
