import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RouteChildrenProps } from "react-router-dom";
import { formValueSelector } from "redux-form/immutable";
import {
  createComponentAction,
  setIsSubmittingApplicationComponent,
  updateComponentAction
} from "../../actions/application";
import { ComponentLikeForm } from "../../forms/ComponentLike";
import { RootState } from "../../reducers";
import { ApplicationComponent, SharedEnv } from "../../types/application";
import { ApplicationEditDrawer } from "../../widgets/ApplicationEditDrawer";
import { ComponentStatus } from "../../widgets/ComponentStatus";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ApplicationItemDataWrapper, WithApplicationItemDataProps } from "./ItemDataWrapper";

const mapStateToProps = (state: RootState, props: any) => {
  const selector = formValueSelector("application");
  const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");

  return { sharedEnv };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
      minHeight: "100%",
      backgroundColor: "#F4F5F7"
    },
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center"
    },
    secondHeaderRightItem: {
      marginLeft: 20
    }
  });

interface State {}

interface Props
  extends WithApplicationItemDataProps,
    WithStyles<typeof styles>,
    RouteChildrenProps<{ applicationName: string }>,
    ReturnType<typeof mapStateToProps> {}

class ApplicationEditRaw extends React.PureComponent<Props, State> {
  private submitComponent = async (component: ApplicationComponent) => {
    // console.log("submitComponent", component.toJS());

    const { dispatch, application, currentComponent } = this.props;

    if (!currentComponent || !currentComponent.get("name")) {
      await dispatch(createComponentAction(component));
    } else {
      await dispatch(updateComponentAction(component));
    }
    dispatch(push(`/applications/${application?.get("name")}/edit?component=${component.get("name")}`));
  };

  public renderApplicationEditDrawer() {
    const { application, currentComponent } = this.props;

    return <ApplicationEditDrawer application={application} currentComponent={currentComponent} />;
  }

  public render() {
    const { isLoading, application } = this.props;

    return (
      <BasePage
        leftDrawer={this.renderApplicationEditDrawer()}
        secondHeaderRight={
          "Component"
          // <div className={classes.secondHeaderRight}>
          //   <>
          //     <CustomizedButton
          //       color="primary"
          //       className={classes.secondHeaderRightItem}
          //       onClick={() => dispatch(submit("componentLike"))}>
          //       Save Component
          //     </CustomizedButton>
          //     <CustomizedButton
          //       color="primary"
          //       className={classes.secondHeaderRightItem}
          //       disabled={this.props.application?.get("components")?.size === 0}
          //       onClick={() => this.handleDeleteComponent()}>
          //       Delete Component
          //     </CustomizedButton>
          //   </>
          // </div>
        }
        secondHeaderLeft={application && application.get("name")}>
        {isLoading && !application ? <Loading /> : this.renderForm()}
      </BasePage>
    );
  }

  public renderForm() {
    const { application, sharedEnv, dispatch, classes, currentComponent } = this.props;

    return (
      <Grid container spacing={2} className={classes.root}>
        <Grid item xs={8} sm={8} md={8}>
          <ComponentLikeForm
            application={application}
            sharedEnv={sharedEnv}
            onSubmit={this.submitComponent}
            onSubmitFail={() => {
              dispatch(setIsSubmittingApplicationComponent(false));
            }}
            initialValues={currentComponent}
            showDataView
          />
        </Grid>
        <Grid item xs={4} sm={4} md={4}>
          <ComponentStatus
            component={application?.get("components")?.find(x => x.get("name") === currentComponent?.get("name"))}
          />
        </Grid>
      </Grid>
    );
  }
}

export const ApplicationEdit = connect(mapStateToProps)(
  withStyles(styles)(ApplicationItemDataWrapper({ reloadFrequency: 3000 })(ApplicationEditRaw))
);
