import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { RouteChildrenProps } from "react-router";
import { updateComponentAction } from "../../actions/componentTemplate";
import {
  setErrorNotificationAction,
  setSuccessNotificationAction
} from "../../actions/notification";
import { ComponentTemplateForm } from "../../forms/ComponentTemplate";
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
    RouteChildrenProps<{ componentTemplateId: string }>,
    WithStyles<typeof styles> {}

class ComponentTemplateEditRaw extends React.PureComponent<Props> {
  private submit = async (component: ComponentTemplate) => {
    const { dispatch, match } = this.props;
    const { componentTemplateId } = match!.params;

    try {
      await dispatch(updateComponentAction(componentTemplateId, component));
      dispatch(setSuccessNotificationAction("Component update successful"));
      dispatch(push("/componenttemplates"));
    } catch (e) {
      dispatch(setErrorNotificationAction("Component update failed"));
    }
  };

  private getComponentTemplate() {
    const { componentTemplates, match } = this.props;
    const { componentTemplateId } = match!.params;
    return componentTemplates.find(x => x.get("id") === componentTemplateId)!;
  }

  private renderFormContent() {
    const componentTemplate = this.getComponentTemplate();

    return (
      <ComponentTemplateForm
        onSubmit={this.submit}
        initialValues={componentTemplate}
      />
    );
  }

  public render() {
    const { isLoading, isFirstLoaded, classes } = this.props;
    const componentTemplate = this.getComponentTemplate();

    return (
      <BasePage
        title={
          isLoading || !isFirstLoaded
            ? ""
            : `Edit ${componentTemplate.get("name")}`
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
