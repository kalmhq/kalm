import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { updateComponentAction } from "actions/component";
import { push } from "connected-react-router";
import { ComponentLikeForm } from "forms/ComponentLike";
import { withComponent, WithComponentProp } from "hoc/withComponent";
import produce from "immer";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
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

class ComponentEditRaw extends React.PureComponent<Props> {
  private submit = async (formValues: ComponentLike) => {
    const { dispatch, activeNamespaceName, component } = this.props;
    if (formValues.preInjectedFiles) {
      formValues = produce(formValues, (draft) => {
        draft.preInjectedFiles = formValues.preInjectedFiles?.filter((file) => file.mountPath || file.content);
      });
    }
    await dispatch(updateComponentAction(formValues, activeNamespaceName));
    dispatch(push(`/applications/${activeNamespaceName}/components/${component.name}`));
  };

  public render() {
    const { component, initialValues } = this.props;
    return (
      <BasePage
        secondHeaderLeft={<Namespaces />}
        leftDrawer={<ApplicationSidebar />}
        secondHeaderRight={<H6>Edit {component.name} Component</H6>}
      >
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <ComponentLikeForm _initialValues={initialValues} onSubmit={this.submit} />
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

export const ComponentEditPage = withComponent(withStyles(styles)(connect(mapStateToProps)(ComponentEditRaw)));
