import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import Immutable from "immutable";
import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { RouteChildrenProps } from "react-router-dom";
import { formValueSelector } from "redux-form/immutable";
import {
  createComponentAction,
  deleteComponentAction,
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
import { push } from "connected-react-router";

const mapStateToProps = (state: RootState, props: any) => {
  const selector = formValueSelector("application");
  const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");

  const { location, application } = props;
  console.log("hash", location.hash);
  let search = queryString.parse(location.search);
  console.log("search", search);
  console.log("application", application);

  return { sharedEnv };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
      // height: "100%",
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

interface State {
  // currentComponent?: ApplicationComponent;
  // changingComponent: boolean; // for form componentLike enableReinitialize
}

interface Props
  extends WithApplicationItemDataProps,
    WithStyles<typeof styles>,
    RouteChildrenProps<{ applicationName: string }>,
    ReturnType<typeof mapStateToProps> {}

class ApplicationEditRaw extends React.PureComponent<Props, State> {
  // constructor(props: Props) {
  //   super(props);

  //   this.state = {
  //     // currentComponent: undefined,
  //     changingComponent: false
  //   };
  // }

  // public componentDidMount() {
  //   const { location } = this.props;
  //   let search = queryString.parse(location.search);
  //   if (search.component !== undefined) {
  //     if (search.component === "") {
  //     } else {
  //     }
  //   }
  // }

  // public componentDidUpdate(prevProps: Props, prevState: State) {
  //   const prevComponentName = prevProps.component?.get("name");
  //   const thisComponentName = this.props.component?.get("name");

  //   if (prevComponentName !== thisComponentName) {
  //     this.setState({ changingComponent: true });
  //   }

  //   if (prevComponentName === thisComponentName && this.state.changingComponent) {
  //     this.setState({ changingComponent: false });
  //   }
  // }

  private submitComponent = async (component: ApplicationComponent) => {
    // console.log("submitComponent", component.toJS());

    const { dispatch, component: currentComponent } = this.props;

    if (!currentComponent || !currentComponent.get("name")) {
      // this.setState({
      //   currentComponent: component
      //   // currentComponentTab: "basic"
      // });

      await dispatch(createComponentAction(component));
      dispatch(push(`/applications/edit?component=${component.get("name")}`));
    } else {
      // this.setState({
      //   currentComponent: component
      // });

      await dispatch(updateComponentAction(component));
      dispatch(push(`/applications/edit?component=${component.get("name")}`));
    }
  };

  public renderApplicationEditDrawer() {
    const { application, dispatch, component: currentComponent } = this.props;
    // const { currentComponent } = this.state;

    return (
      <ApplicationEditDrawer
        application={application}
        currentComponent={currentComponent}
        handleClickComponent={(component?: ApplicationComponent) => {
          dispatch(
            push(
              `/applications/kapp-hello-world/edit?component=${
                component ? (component.get("name") ? component.get("name") : "") : ""
              }`
            )
          );
          // this.setState({
          //   currentComponent: component
          // });
        }}
      />
    );
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
    const { application, sharedEnv, dispatch, classes, component: currentComponent } = this.props;
    // const { changingComponent } = this.state;

    // if (changingComponent) {
    //   return null;
    // }

    return (
      <Grid container spacing={2} className={classes.root}>
        <Grid item xs={8} sm={8} md={8}>
          <ComponentLikeForm
            sharedEnv={sharedEnv}
            onSubmit={this.submitComponent}
            onSubmitFail={() => {
              dispatch(setIsSubmittingApplicationComponent(false));
            }}
            initialValues={currentComponent}
            // currentTab={currentComponentTab}
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
