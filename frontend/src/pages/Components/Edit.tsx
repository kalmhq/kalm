import { Box, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { push } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import { updateComponentAction } from "actions/component";
import { ComponentLike, ComponentLikeContent } from "types/componentTemplate";
import { Namespaces } from "widgets/Namespaces";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { H6 } from "widgets/Label";
import { connect } from "react-redux";
import { withComponent, WithComponentProp } from "hoc/withComponent";
import { ComponentStatus } from "widgets/ComponentStatus";
import { correctComponentFormValuesForInit, componentDetailsToComponent } from "utils/application";
import { RootState } from "reducers";
import Immutable from "immutable";

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
  private submit = async (formValues: ComponentLikeContent) => {
    const { dispatch, activeNamespaceName, component } = this.props;
    formValues.preInjectedFiles = formValues.preInjectedFiles?.filter(
      (file) => file.get("mountPath") || file.get("content"),
    );
    await dispatch(updateComponentAction(Immutable.fromJS(formValues), activeNamespaceName));
    const name = component.get("name");
    dispatch(push(`/applications/${activeNamespaceName}/components/${name}`));
  };

  public render() {
    const { component } = this.props;
    return (
      <BasePage
        secondHeaderLeft={<Namespaces />}
        leftDrawer={<ApplicationSidebar />}
        secondHeaderRight={<H6>Edit {component!.get("name")} Component</H6>}
      >
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              {/* <ComponentLikeForm
                _initialValues={initialValues}
                onSubmit={this.submit}
              /> */}
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
