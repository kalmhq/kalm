import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { withNamespace, withNamespaceProps } from "permission/Namespace";
import React from "react";
import { connect } from "react-redux";
import { RouteChildrenProps } from "react-router-dom";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { Details } from "./Detail";
import { ApplicationItemDataWrapper, WithApplicationItemDataProps } from "./ItemDataWrapper";

const mapStateToProps = (_: any, props: any) => {
  const { match } = props;
  const { namespace, applicationName } = match!.params;
  return {
    namespace,
    applicationName
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // padding: theme.spacing(3)
    }
  });

interface Props
  extends WithApplicationItemDataProps,
    withNamespaceProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    RouteChildrenProps<{ applicationName: string }> {}

class ApplicationShowRaw extends React.PureComponent<Props> {
  public render() {
    const { isLoading, application, applicationName, dispatch } = this.props;
    // const hasWriterRole = hasRole("writer");
    return (
      <BasePage>
        {isLoading && !application ? (
          <Loading />
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
  connect(mapStateToProps)(ApplicationItemDataWrapper({ reloadFrequency: 5000 })(withNamespace(ApplicationShowRaw)))
);
