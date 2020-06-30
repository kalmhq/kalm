import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { push } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import { updateComponentAction } from "actions/application";
import { ComponentLike } from "types/componentTemplate";
import { Namespaces } from "widgets/Namespaces";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { H4 } from "widgets/Label";
import { ComponentLikeForm } from "forms/ComponentLike";
import { connect } from "react-redux";
import { withComponent, WithComponentProp } from "hoc/withComponent";
import { ComponentStatus } from "widgets/ComponentStatus";
import { correctComponentFormValuesForInit, componentDetailsToComponent } from "utils/application";

const styles = (theme: Theme) => createStyles({});

interface Props extends WithStyles<typeof styles>, WithComponentProp {}

class ComponentEditRaw extends React.PureComponent<Props> {
  private submit = async (formValues: ComponentLike) => {
    const { dispatch, activeNamespaceName } = this.props;
    return await dispatch(updateComponentAction(formValues, activeNamespaceName));
  };

  private onSubmitSuccess = () => {
    const { dispatch, activeNamespaceName } = this.props;
    dispatch(push(`/applications/${activeNamespaceName}/components`));
  };

  public render() {
    const { component } = this.props;
    return (
      <BasePage
        secondHeaderLeft={<Namespaces />}
        leftDrawer={<ApplicationSidebar />}
        secondHeaderRight={<H4>Edit {component!.get("name")} Component</H4>}
      >
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <ComponentLikeForm
                initialValues={correctComponentFormValuesForInit(componentDetailsToComponent(component))}
                onSubmit={this.submit}
                onSubmitSuccess={this.onSubmitSuccess}
              />
            </Grid>
            <Grid xs={4} item>
              <ComponentStatus component={component} />
            </Grid>
          </Grid>
        </Box>
      </BasePage>
    );
  }
}

export const ComponentEditPage = withComponent(withStyles(styles)(connect()(ComponentEditRaw)));
