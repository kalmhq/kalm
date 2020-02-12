import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import {
  Actions,
  ComponentFormValues,
  newEmptyComponentFormValues
} from "../../actions";
import { createComponentAction } from "../../actions/component";
import ComponentForm from "../../forms/Component";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";
import { setSuccessNotificationAction } from "../../actions/notification";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ComponentNew extends React.PureComponent<Props> {
  private submit = async (componentFormValues: ComponentFormValues) => {
    const { dispatch } = this.props;
    await dispatch(createComponentAction(componentFormValues));
    await dispatch(
      setSuccessNotificationAction("Create component successfully")
    );
    await dispatch(push("/components"));
  };

  public render() {
    const { classes } = this.props;
    return (
      <BasePage title="New Component">
        <div className={classes.root}>
          <ComponentForm
            onSubmit={this.submit}
            initialValues={newEmptyComponentFormValues()}
          />
        </div>
      </BasePage>
    );
  }
}

export default withStyles(styles)(connect()(ComponentNew));
