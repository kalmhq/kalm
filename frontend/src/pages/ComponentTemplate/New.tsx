import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { createComponentTemplateAction } from "../../actions/componentTemplate";
import { setSuccessNotificationAction } from "../../actions/notification";
import { ComponentLikeForm } from "../../forms/ComponentLike";
import { RootState } from "../../reducers";
import { Actions } from "../../types";
import { ComponentLike, ComponentTemplate, newEmptyComponentLike } from "../../types/componentTemplate";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ComponentTemplateNewRaw extends React.PureComponent<Props> {
  private submit = async (componentLike: ComponentLike) => {
    const { dispatch } = this.props;
    const component = componentLike as ComponentTemplate;
    await dispatch(createComponentTemplateAction(component));
    await dispatch(setSuccessNotificationAction("Create component successfully"));
    await dispatch(push("/componenttemplates"));
  };

  public render() {
    return (
      <BasePage>
        <ComponentLikeForm
          onSubmit={this.submit}
          initialValues={newEmptyComponentLike()}
          showDataView
          showSubmitButton
        />
      </BasePage>
    );
  }
}

export const ComponentTemplateNew = withStyles(styles)(connect()(ComponentTemplateNewRaw));
