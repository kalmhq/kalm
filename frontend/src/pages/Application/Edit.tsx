import { createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import React from "react";
import { connect } from "react-redux";
import { RouteChildrenProps } from "react-router-dom";
import { createComponentAction, updateComponentAction } from "../../actions/application";
import { RootState } from "../../reducers";
import { ApplicationComponent } from "../../types/application";
import { ApplicationEditDrawer } from "../../widgets/ApplicationEditDrawer";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { ApplicationItemDataWrapper, WithApplicationItemDataProps } from "./ItemDataWrapper";

const mapStateToProps = (state: RootState, props: any) => {
  // const selector = formValueSelector(APPLICATION_FORM_ID);
  // const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnvs");
  const hash = window.location.hash;
  const anchor = hash.replace("#", "");

  return { anchor };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      minHeight: "100%",
      backgroundColor: "#F4F5F7",
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
    const { dispatch, currentComponent, application, anchor } = this.props;

    if (!currentComponent || !currentComponent.get("name")) {
      await dispatch(createComponentAction(component));
      dispatch(
        push(`/applications/${application?.get("name")}/edit?component=${component.get("name") || ""}#${anchor}`),
      );
    } else {
      await dispatch(updateComponentAction(component));
    }
  };

  // !!! should not use currentComponent name, when create currentComponent name is null will cause a bug.
  // so move to submitComponent to push by using component (submit) name
  // private onSubmitComponentSuccess = (_result: any) => {
  //   const { dispatch, application, currentComponent, anchor } = this.props;

  //   // the form will reinitialize very quick, and make the dirty flag to false.
  //   // When dirty flag is false, the route change prompt won't exist.
  //   window.setTimeout(() => {
  //     dispatch(
  //       push(`/applications/${application?.get("name")}/edit?component=${currentComponent.get("name")}#${anchor}`),
  //     );
  //   }, 100);
  // };

  public renderApplicationEditDrawer() {
    const { application, currentComponent } = this.props;

    return <ApplicationEditDrawer application={application} currentComponent={currentComponent} />;
  }

  public render() {
    const { isLoading, application } = this.props;

    return (
      <BasePage
        leftDrawer={this.renderApplicationEditDrawer()}
        secondHeaderRight={"Component"}
        secondHeaderLeft={application && application.get("name")}
      >
        {isLoading && !application ? <Loading /> : this.renderForm()}
      </BasePage>
    );
  }

  public renderForm() {
    const { changingComponent } = this.state;

    if (changingComponent) {
      return <div />;
    }

    return null;

    // return (
    //   <Box p={2}>
    //     <Grid container spacing={2} className={classes.root}>
    //       <Grid item md={8}>
    //       </Grid>
    //       <Grid item md={4}>
    //         <ComponentStatus
    //           component={application?.get("components")?.find((x) => x.get("name") === currentComponent?.get("name"))}
    //         />
    //       </Grid>
    //     </Grid>
    //   </Box>
    // );
  }
}

export const ApplicationEdit = connect(mapStateToProps)(
  withStyles(styles)(ApplicationItemDataWrapper({ autoReload: false })(ApplicationEditRaw)),
);
