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
import { ComponentTemplate, ComponentLike } from "../../actions";

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
  private submit = async (componentLike: ComponentLike) => {
    const { dispatch, match } = this.props;
    const { componentTemplateId } = match!.params;
    const component = componentLike as ComponentTemplate;

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

    return <ComponentLikeForm onSubmit={this.submit} initialValues={componentTemplate} isEdit={true} showDataView />;
  }

  public render() {
    const { isLoading, isFirstLoaded, classes } = this.props;
    const componentTemplate = this.getComponentTemplate();

    return (
      <BasePage title={isLoading || !isFirstLoaded ? "" : `Edit ${componentTemplate.get("name")}`}>
        <div className={classes.root}>{isLoading || !isFirstLoaded ? <Loading /> : this.renderFormContent()}</div>
      </BasePage>
    );
  }
}

export const ComponentTemplateEdit = withStyles(styles)(ComponentTemplateDataWrapper(ComponentTemplateEditRaw));
