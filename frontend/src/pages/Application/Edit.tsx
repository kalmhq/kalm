import { Box, createStyles, Grid, Theme, WithStyles, withStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { RouteChildrenProps } from "react-router-dom";
import {
  createComponentAction,
  setIsSubmittingApplicationComponent,
  updateComponentAction,
} from "../../actions/application";
import { ComponentLikeForm } from "../../forms/ComponentLike";
import { RootState } from "../../reducers";
import { ApplicationComponent } from "../../types/application";
import { ApplicationEditDrawer } from "../../widgets/ApplicationEditDrawer";
import { ComponentStatus } from "../../widgets/ComponentStatus";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ApplicationItemDataWrapper, WithApplicationItemDataProps } from "./ItemDataWrapper";

const mapStateToProps = (state: RootState, props: any) => {
  // const selector = formValueSelector("application");
  // const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");
  const hash = window.location.hash;
  const anchor = hash.replace("#", "");

  return { anchor };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
      minHeight: "100%",
      backgroundColor: "#F4F5F7",
    },
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
    },
    secondHeaderRightItem: {
      marginLeft: 20,
    },
  });

interface State {
  changingComponent: boolean;
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
      changingComponent: false,
    };
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    const prevComponentName = prevProps.component?.get("name");
    const thisComponentName = this.props.component?.get("name");

    if (prevComponentName !== thisComponentName) {
      this.setState({ changingComponent: true });
    }

    if (prevComponentName === thisComponentName && this.state.changingComponent) {
      this.setState({ changingComponent: false });
    }
  }

  private submitComponent = async (component: ApplicationComponent) => {
    const { dispatch, currentComponent } = this.props;

    if (!currentComponent || !currentComponent.get("name")) {
      await dispatch(createComponentAction(component));
    } else {
      await dispatch(updateComponentAction(component));
    }
  };

  private onSubmitComponentSuccess = (_result: any) => {
    const { dispatch, application, currentComponent, anchor } = this.props;

    // the form will reinitialize very quick, and make the dirty flag to false.
    // When dirty flag is false, the route change prompt won't exist.
    window.setTimeout(() => {
      dispatch(
        push(`/applications/${application?.get("name")}/edit?component=${currentComponent.get("name")}#${anchor}`),
      );
    }, 100);
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
        secondHeaderLeft={application && application.get("name")}
      >
        {isLoading && !application ? <Loading /> : this.renderForm()}
      </BasePage>
    );
  }

  public renderForm() {
    const { application, dispatch, classes, currentComponent } = this.props;
    const { changingComponent } = this.state;

    if (changingComponent) {
      return null;
    }

    return (
      <Box p={2}>
        <Grid container spacing={2} className={classes.root}>
          <Grid item md={8}>
            <ComponentLikeForm
              application={application}
              // sharedEnv={sharedEnv}
              onSubmit={this.submitComponent}
              onSubmitFail={() => {
                dispatch(setIsSubmittingApplicationComponent(false));
              }}
              onSubmitSuccess={this.onSubmitComponentSuccess}
              initialValues={currentComponent}
              showDataView
            />
          </Grid>
          <Grid item md={4}>
            <ComponentStatus
              component={application?.get("components")?.find((x) => x.get("name") === currentComponent?.get("name"))}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }
}

export const ApplicationEdit = connect(mapStateToProps)(
  withStyles(styles)(ApplicationItemDataWrapper({ reloadFrequency: 5000 })(ApplicationEditRaw)),
);
