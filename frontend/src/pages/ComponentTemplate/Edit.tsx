import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { RouteChildrenProps } from "react-router";
import { updateComponentAction } from "../../actions/componentTemplate";
import { setErrorNotificationAction, setSuccessNotificationAction } from "../../actions/notification";
import { ComponentLikeForm } from "../../forms/ComponentLike";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ComponentTemplateDataWrapper, WithComponentTemplatesDataProps } from "./DataWrapper";
import RemoteSubmitComponentLike from "../../forms/ComponentLike/remoteSubmitComponentLike";
import { ComponentLike, ComponentTemplate } from "../../types/componentTemplate";

const styles = (theme: Theme) => createStyles({});

interface Props
  extends WithComponentTemplatesDataProps,
    RouteChildrenProps<{ componentTemplateName: string }>,
    WithStyles<typeof styles> {}

class ComponentTemplateEditRaw extends React.PureComponent<Props> {
  private submit = async (componentLike: ComponentLike) => {
    const { dispatch } = this.props;
    const component = componentLike as ComponentTemplate;

    try {
      await dispatch(updateComponentAction(component));
      dispatch(setSuccessNotificationAction("Component update successful"));
      dispatch(push("/componenttemplates"));
    } catch (e) {
      dispatch(setErrorNotificationAction("Component update failed"));
    }
  };

  private getComponentTemplate() {
    const { componentTemplates, match } = this.props;
    const { componentTemplateName } = match!.params;
    return componentTemplates.find(x => x.get("name") === componentTemplateName)!;
  }

  private renderFormContent() {
    const componentTemplate = this.getComponentTemplate();

    return (
      <ComponentLikeForm
        onSubmit={this.submit}
        initialValues={componentTemplate}
        isEdit={true}
        showDataView
        showSubmitButton
      />
    );
  }

  public render() {
    const { isLoading, isFirstLoaded } = this.props;
    const componentTemplate = this.getComponentTemplate();

    return (
      <BasePage
        title={isLoading || !isFirstLoaded ? "" : `Edit ${componentTemplate.get("name")}`}
        rightAction={<RemoteSubmitComponentLike />}>
        {isLoading || !isFirstLoaded ? <Loading /> : this.renderFormContent()}
      </BasePage>
    );
  }
}

export const ComponentTemplateEdit = withStyles(styles)(ComponentTemplateDataWrapper(ComponentTemplateEditRaw));
