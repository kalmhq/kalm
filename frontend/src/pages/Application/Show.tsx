import { createStyles, Theme, withStyles, WithStyles, Button } from "@material-ui/core";
import { Link } from "react-router-dom";
import React from "react";
import { RouteChildrenProps } from "react-router-dom";
import { BasePage } from "../BasePage";
import { Details } from "./Detail";
import { Loading } from "../../widgets/Loading";
import { connect } from "react-redux";
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
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    RouteChildrenProps<{ applicationName: string }> {}

class ApplicationShowRaw extends React.PureComponent<Props> {
  public render() {
    const { isLoading, application, applicationName, dispatch } = this.props;
    return (
      <BasePage
        title={`Application ${application && application.get("name")}`}
        rightAction={
          <Link to={`/applications/${application && application.get("name")}/edit`}>
            <Button>Edit</Button>
          </Link>
        }>
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
  connect(mapStateToProps)(ApplicationItemDataWrapper({ reloadFrequency: 5000 })(ApplicationShowRaw))
);
