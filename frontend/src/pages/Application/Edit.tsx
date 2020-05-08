import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { RouteChildrenProps } from "react-router-dom";
import { submit } from "redux-form";
import { formValueSelector } from "redux-form/immutable";
import {
  setIsSubmittingApplicationComponent,
  updateApplicationAction,
  updateComponentAction,
  createComponentAction,
  deleteComponentAction
} from "../../actions/application";
import ApplicationForm from "../../forms/Application";
import { ComponentLikeForm } from "../../forms/ComponentLike";
import { RootState } from "../../reducers";
import { Application, ApplicationComponent, SharedEnv } from "../../types/application";
import { ApplicationDrawer } from "../../widgets/ApplicationDrawer";
import { CustomizedButton } from "../../widgets/Button";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ApplicationItemDataWrapper, WithApplicationItemDataProps } from "./ItemDataWrapper";
import queryString from "query-string";

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector("application");
  const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");

  return { sharedEnv };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
      height: "100%"
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

interface State {
  currentFormType: "application" | "component";
  currentApplicationTab: "basic" | "sharedEnvs";
  currentComponent?: ApplicationComponent;
  // currentComponentTab?: "envs" | "ports" | "resources" | "plugins" | "probes" | "advanced";
  currentComponentTab?: string;
  changingComponent: boolean; // for form componentLike enableReinitialize
}

interface Props
  extends WithApplicationItemDataProps,
    WithStyles<typeof styles>,
    RouteChildrenProps<{ applicationName: string }>,
    ReturnType<typeof mapStateToProps> {}

class ApplicationEditRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      currentFormType: "component",
      currentApplicationTab: "basic",
      currentComponent: undefined,
      currentComponentTab: "basic",
      changingComponent: false
    };
  }

  public componentDidMount() {
    const { location } = this.props;
    let search = queryString.parse(location.search);
    if (search.component !== undefined) {
      if (search.component === "") {
      } else {
      }
    }
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    const prevComponentName = prevState.currentComponent?.get("name");
    const thisComponentName = this.state.currentComponent?.get("name");

    if (prevComponentName !== thisComponentName) {
      this.setState({ changingComponent: true });
    }

    if (prevComponentName === thisComponentName && this.state.changingComponent) {
      this.setState({ changingComponent: false });
    }
  }

  private submitApplication = async (application: Application) => {
    // console.log("submitApplication", application.toJS());
    const { dispatch } = this.props;

    await dispatch(updateApplicationAction(application));
  };

  private submitComponent = async (component: ApplicationComponent) => {
    // console.log("submitComponent", component.toJS());

    const { dispatch } = this.props;
    const { currentComponent } = this.state;

    this.setState({
      currentComponent: component
    });

    if (!currentComponent || !currentComponent.get("name")) {
      await dispatch(createComponentAction(component));
    } else {
      await dispatch(updateComponentAction(component));
    }
  };

  private handleDeleteComponent() {
    const { application, dispatch } = this.props;
    const { currentComponent } = this.state;

    if (currentComponent) {
      if (!currentComponent.get("name")) {
        this.setState({
          currentComponent: application?.get("components").get(0),
          currentComponentTab: "basic"
        });
      } else {
        dispatch(deleteComponentAction(currentComponent.get("name")));
      }

      if (
        currentComponent.get("name") ===
        application
          ?.get("components")
          .get(0)
          ?.get("name")
      ) {
        this.setState({
          currentComponent: undefined,
          currentComponentTab: "basic"
        });
      }
    }
  }

  public renderApplicationDrawer() {
    const { application } = this.props;
    const { currentComponent } = this.state;

    return (
      <ApplicationDrawer
        application={application}
        currentComponent={currentComponent}
        // handleClickBasic={() => {
        //   this.setState({
        //     currentFormType: "application",
        //     currentApplicationTab: "basic"
        //   });
        // }}
        handleClickSharedEnvs={() => {
          this.setState({
            currentFormType: "application",
            currentApplicationTab: "sharedEnvs"
          });
        }}
        handleClickComponent={(component: ApplicationComponent) => {
          this.setState({
            currentFormType: "component",
            currentComponent: component,
            currentComponentTab: "basic"
          });
        }}
        handleClickComponentTab={(component: ApplicationComponent, tab: string) => {
          this.setState({
            currentFormType: "component",
            currentComponent: component,
            currentComponentTab: tab
          });
        }}
      />
    );
  }

  public render() {
    const { isLoading, application, dispatch, classes } = this.props;
    const { currentFormType } = this.state;
    // console.log("render", this.state.currentComponent);

    return (
      <BasePage
        leftDrawer={this.renderApplicationDrawer()}
        secondHeaderRight={
          <div className={classes.secondHeaderRight}>
            {currentFormType === "application" ? (
              <>
                <CustomizedButton
                  color="primary"
                  className={classes.secondHeaderRightItem}
                  onClick={() => dispatch(submit("application"))}>
                  Save Application
                </CustomizedButton>
              </>
            ) : (
              <>
                <CustomizedButton
                  color="primary"
                  className={classes.secondHeaderRightItem}
                  onClick={() => dispatch(submit("componentLike"))}>
                  Save Component
                </CustomizedButton>
                <CustomizedButton
                  color="primary"
                  className={classes.secondHeaderRightItem}
                  disabled={this.props.application?.get("components")?.size === 0}
                  onClick={() => this.handleDeleteComponent()}>
                  Delete Component
                </CustomizedButton>
              </>
            )}
          </div>
        }
        secondHeaderLeft={application && application.get("name")}>
        {isLoading ? <Loading /> : this.renderForm()}
      </BasePage>
    );
  }

  public renderForm() {
    const { application, sharedEnv, dispatch } = this.props;
    const {
      currentFormType,
      currentComponent,
      currentApplicationTab,
      currentComponentTab,
      changingComponent
    } = this.state;

    if (currentFormType === "application") {
      return (
        <ApplicationForm
          onSubmit={this.submitApplication}
          initialValues={application}
          isEdit={true}
          currentTab={currentApplicationTab}
        />
      );
    }

    if (changingComponent) {
      return null;
    }

    return (
      <ComponentLikeForm
        sharedEnv={sharedEnv}
        onSubmit={this.submitComponent}
        onSubmitFail={() => {
          dispatch(setIsSubmittingApplicationComponent(false));
        }}
        initialValues={currentComponent}
        currentTab={currentComponentTab}
        showDataView
      />
    );
  }
}

export const ApplicationEdit = connect(mapStateToProps)(
  withStyles(styles)(ApplicationItemDataWrapper({ reloadFrequency: 0 })(ApplicationEditRaw))
);
