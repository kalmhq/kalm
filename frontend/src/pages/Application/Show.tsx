import { createStyles, IconButton, Theme, WithStyles, withStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import { withNamespace, withNamespaceProps } from "permission/Namespace";
import React from "react";
import { connect } from "react-redux";
import { RouteChildrenProps } from "react-router-dom";
import { CustomizedButton } from "widgets/Button";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { H4 } from "../../widgets/Label";
import { Loading } from "../../widgets/Loading";
import { Namespaces } from "../../widgets/Namespaces";
import { BasePage } from "../BasePage";
import { Details } from "./Detail";
import { ApplicationItemDataWrapper, WithApplicationItemDataProps } from "./ItemDataWrapper";
import ComponentDetail from "./ComponentDetail";
import { ArrowBackIcon } from "widgets/Icon";

const mapStateToProps = (_: any, props: any) => {
  const { match } = props;
  const { namespace, applicationName, componentName } = match!.params;
  return {
    namespace,
    applicationName,
    componentName,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
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

interface Props
  extends WithApplicationItemDataProps,
    withNamespaceProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    RouteChildrenProps<{ applicationName: string; componentName: string }> {}

class ApplicationShowRaw extends React.PureComponent<Props> {
  private renderSecondHeaderRight() {
    const { classes, dispatch, applicationName, componentName } = this.props;
    return (
      <div className={classes.secondHeaderRight}>
        {componentName && (
          <IconButton
            color="primary"
            onClick={() => {
              dispatch(push(`/applications/${applicationName}`));
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <H4 className={classes.secondHeaderRightItem}>{componentName ? "Component Details" : "Application Details"}</H4>
        <CustomizedButton
          color="primary"
          size="large"
          className={classes.secondHeaderRightItem}
          onClick={() => {
            dispatch(
              push(`/applications/${applicationName}/edit${componentName ? `?component=${componentName}` : ""}`),
            );
          }}
        >
          Edit
        </CustomizedButton>
      </div>
    );
  }

  public render() {
    const { isLoading, application, applicationName, dispatch, component } = this.props;

    return (
      <BasePage
        secondHeaderLeft={<Namespaces />}
        secondHeaderRight={this.renderSecondHeaderRight()}
        leftDrawer={<ApplicationSidebar />}
      >
        {isLoading && !application ? (
          <Loading />
        ) : component ? (
          <ComponentDetail
            application={application}
            dispatch={dispatch}
            component={component}
            activeNamespaceName={this.props.activeNamespaceName}
          />
        ) : application ? (
          <Details application={application} dispatch={dispatch} activeNamespaceName={this.props.activeNamespaceName} />
        ) : (
          `Can't find application with name ${applicationName}`
        )}
      </BasePage>
    );
  }
}

export const ApplicationShow = withStyles(styles)(
  connect(mapStateToProps)(ApplicationItemDataWrapper({ reloadFrequency: 5000 })(withNamespace(ApplicationShowRaw))),
);
