import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createComponentAction } from "actions/component";
import { setSuccessNotificationAction } from "actions/notification";
import { push } from "connected-react-router";
import { ComponentLikeForm } from "forms/ComponentLike";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { BasePage } from "pages/BasePage";
import { ApplicationSidebar } from "pages/Namespace/ApplicationSidebar";
import React from "react";
import { connect } from "react-redux";
import { ComponentLike, newEmptyComponentLike } from "types/componentTemplate";
import { Namespaces } from "widgets/Namespaces";

const styles = (theme: Theme) => createStyles({});

interface Props extends WithStyles<typeof styles>, WithNamespaceProps {}

const ComponentNewRaw: React.FC<Props> = (props) => {
  const submit = async (formValues: ComponentLike) => {
    const { dispatch, activeNamespaceName } = props;

    if (formValues.preInjectedFiles) {
      formValues.preInjectedFiles = formValues.preInjectedFiles?.filter((file) => file.mountPath || file.content);
    }

    await dispatch(createComponentAction(formValues, activeNamespaceName));
    dispatch(setSuccessNotificationAction("Create component successfully"));
    dispatch(push(`/namespaces/${activeNamespaceName}/components`));
  };

  return (
    <BasePage
      secondHeaderLeft={<Namespaces />}
      leftDrawer={<ApplicationSidebar />}
      secondHeaderRight="Create Component"
    >
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ComponentLikeForm _initialValues={newEmptyComponentLike} onSubmit={submit} />
          </Grid>
        </Grid>
      </Box>
    </BasePage>
  );
};

export const ComponentNewPage = withNamespace(withStyles(styles)(connect()(ComponentNewRaw)));
