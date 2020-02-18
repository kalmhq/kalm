import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { RouteChildrenProps } from "react-router";
import { updateComponentAction } from "../../actions/component";
import {
  setErrorNotificationAction,
  setSuccessNotificationAction
} from "../../actions/notification";
import { ComponentTemplateForm } from "../../forms/Component";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import {
  ComponentTemplateDataWrapper,
  WithComponentTemplatesDataProps
} from "./DataWrapper";
import { ComponentTemplate } from "../../actions";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3)
    }
  });

interface Props
  extends WithComponentTemplatesDataProps,
    RouteChildrenProps<{ componentId: string }>,
    WithStyles<typeof styles> {}

class ComponentTemplateEditRaw extends React.PureComponent<Props> {
  private submit = async (component: ComponentTemplate) => {
    const { dispatch, match } = this.props;
    const { componentId } = match!.params;

    try {
      await dispatch(updateComponentAction(componentId, component));
      dispatch(setSuccessNotificationAction("Component update successful"));
      dispatch(push("/componenttemplates"));
    } catch (e) {
      dispatch(setErrorNotificationAction("Component update failed"));
    }
  };

  private getComponent() {
    const { components, match } = this.props;
    const { componentId } = match!.params;
    return components.find(x => x.get("id") === componentId)!;
  }

  private renderFormContent() {
    const component = this.getComponent();

    return (
      <ComponentTemplateForm onSubmit={this.submit} initialValues={component} />
    );
  }

  public render() {
    const { isLoading, isFirstLoaded, classes } = this.props;
    const component = this.getComponent();

    return (
      <BasePage
        title={
          isLoading || !isFirstLoaded ? "" : `Edit ${component.get("name")}`
        }
      >
        <div className={classes.root}>
          {isLoading || !isFirstLoaded ? <Loading /> : this.renderFormContent()}
        </div>
      </BasePage>
    );
  }
}

export const ComponentTemplateEdit = withStyles(styles)(
  ComponentTemplateDataWrapper(ComponentTemplateEditRaw)
);
