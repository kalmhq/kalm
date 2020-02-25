import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Actions, ComponentTemplate, newEmptyComponentTemplate } from "../../actions";
import { createComponentTemplateAction } from "../../actions/componentTemplate";
import { setSuccessNotificationAction } from "../../actions/notification";
import { ComponentTemplateForm } from "../../forms/ComponentLike";
import { RootState } from "../../reducers";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ComponentTemplateNewRaw extends React.PureComponent<Props> {
  private submit = async (component: ComponentTemplate) => {
    const { dispatch } = this.props;
    await dispatch(createComponentTemplateAction(component));
    await dispatch(setSuccessNotificationAction("Create component successfully"));
    await dispatch(push("/componenttemplates"));
  };

  public render() {
    const { classes } = this.props;
    return (
      <BasePage title="New Component">
        <div className={classes.root}>
          <ComponentTemplateForm onSubmit={this.submit} initialValues={newEmptyComponentTemplate()} />
        </div>
      </BasePage>
    );
  }
}

export const ComponentTemplateNew = withStyles(styles)(connect()(ComponentTemplateNewRaw));
