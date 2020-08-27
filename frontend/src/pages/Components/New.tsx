import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { createComponentAction } from "actions/component";
import { push } from "connected-react-router";
import { ComponentLikeForm } from "forms/ComponentLike";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import Immutable from "immutable";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { ComponentLikeFormContent, newEmptyComponentLike } from "types/componentTemplate";
import { Namespaces } from "widgets/Namespaces";

const styles = (theme: Theme) => createStyles({});

interface Props extends WithStyles<typeof styles>, WithNamespaceProps {}

class ComponentNewRaw extends React.PureComponent<Props> {
  private submit = async (formValues: ComponentLikeFormContent) => {
    const { dispatch, activeNamespaceName } = this.props;

    formValues.preInjectedFiles = formValues.preInjectedFiles?.filter(
      (file) => file.get("mountPath") || file.get("content"),
    );

    await dispatch(createComponentAction(Immutable.fromJS(formValues), activeNamespaceName));
    dispatch(push(`/applications/${activeNamespaceName}/components`));
  };

  public render() {
    return (
      <BasePage
        secondHeaderLeft={<Namespaces />}
        leftDrawer={<ApplicationSidebar />}
        secondHeaderRight="Create Component"
      >
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ComponentLikeForm _initialValues={newEmptyComponentLike} onSubmit={this.submit} />
            </Grid>
          </Grid>
        </Box>
      </BasePage>
    );
  }
}

export const ComponentNewPage = withNamespace(withStyles(styles)(connect()(ComponentNewRaw)));
