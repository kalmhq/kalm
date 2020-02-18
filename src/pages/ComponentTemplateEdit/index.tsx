import React from "react";
import { BasePage } from "../BasePage";
import { ComponentTemplateForm } from "../../forms/Component";
import { Component, Actions } from "../../actions";
import { connect, DispatchProp } from "react-redux";
import { updateComponentAction } from "../../actions/component";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../../reducers";
import { push } from "connected-react-router";
import { match } from "react-router-dom";
import { withStyles, createStyles, Theme, WithStyles } from "@material-ui/core";
import {
  setSuccessNotificationAction,
  setErrorNotificationAction
} from "../../actions/notification";

const mapStateToProps = (
  state: RootState,
  ownProps: { match: match<{ componentId: string }> }
) => {
  const componentId = ownProps.match.params.componentId;
  const component = state
    .get("components")
    .get("components")
    .get(componentId);

  return { componentId, component };
};

type StateProps = ReturnType<typeof mapStateToProps>;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props extends StateProps, WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ComponentTemplateEditRaw extends React.PureComponent<Props> {
  private submit = async (component: Component) => {
    const { dispatch, componentId } = this.props;
    try {
      await dispatch(updateComponentAction(componentId, component));

      dispatch(setSuccessNotificationAction("Component update successful"));
      dispatch(push("/components"));
    } catch (e) {
      dispatch(setErrorNotificationAction("Component update failed"));
    }
  };

  public render() {
    const { component, classes } = this.props;
    return (
      <BasePage title={`Edit Component {component.name}`}>
        <div className={classes.root}>
          <ComponentTemplateForm
            onSubmit={this.submit}
            initialValues={component}
          />
        </div>
      </BasePage>
    );
  }
}

export const ComponentTemplateEdit = withStyles(styles)(
  connect(mapStateToProps)(ComponentTemplateEditRaw)
);
