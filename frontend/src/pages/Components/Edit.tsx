import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { updateComponentAction } from "actions/component";
import { setSuccessNotificationAction } from "actions/notification";
import { push } from "connected-react-router";
import { ComponentLikeForm } from "forms/ComponentLike";
import { withComponent, WithComponentProp } from "hoc/withComponent";
import produce from "immer";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import { ComponentLike } from "types/componentTemplate";
import { componentDetailsToComponent, correctComponentFormValuesForInit } from "utils/application";
import { ComponentStatus } from "widgets/ComponentStatus";
import { H6 } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";

const styles = (theme: Theme) => createStyles({});

interface Props extends WithStyles<typeof styles>, WithComponentProp {
  initialValues: ComponentLike;
}

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    initialValues: correctComponentFormValuesForInit(state, componentDetailsToComponent(ownProps.component)),
  };
};

const ComponentEditRaw: React.FC<Props> = (props) => {
  const submit = async (formValues: ComponentLike) => {
    const { dispatch, activeNamespaceName, component } = props;
    if (formValues.preInjectedFiles) {
      formValues = produce(formValues, (draft) => {
        draft.preInjectedFiles = formValues.preInjectedFiles?.filter((file) => file.mountPath || file.content);
      });
    }
    await dispatch(updateComponentAction(formValues, activeNamespaceName));
    dispatch(setSuccessNotificationAction("Update component successfully"));
    dispatch(push(`/applications/${activeNamespaceName}/components/${component.name}`));
  };

  const { component, initialValues } = props;
  return (
    <BasePage
      secondHeaderLeft={<Namespaces />}
      leftDrawer={<ApplicationSidebar />}
      secondHeaderRight={<H6>Edit {component.name} Component</H6>}
    >
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <ComponentLikeForm _initialValues={initialValues} onSubmit={submit} />
          </Grid>
          <Grid xs={4} item>
            <ComponentStatus component={component} />
          </Grid>
        </Grid>
      </Box>
    </BasePage>
  );
};

export const ComponentEditPage = withComponent(withStyles(styles)(connect(mapStateToProps)(ComponentEditRaw)));
