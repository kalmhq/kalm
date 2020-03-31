import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { RouteChildrenProps } from "react-router-dom";
import { BasePage } from "../BasePage";
import { Details } from "./Detail";
import { Loading } from "../../widgets/Loading";
import { ApplicationListDataWrapper, WithApplicationsDataProps } from "./ListDataWrapper";
import { connect } from "react-redux";

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
  extends WithApplicationsDataProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    RouteChildrenProps<{ applicationName: string }> {}

class ApplicationShowRaw extends React.PureComponent<Props> {
  public render() {
    const { isLoading, isFirstLoaded, applicationList, applicationName, dispatch } = this.props;
    const application = applicationList.find(x => x.get("name") === applicationName);
    return (
      <BasePage title={`Application ${application && application.get("name")}`}>
        {isLoading && !isFirstLoaded ? (
          <Loading />
        ) : application ? (
          <Details application={application} dispatch={dispatch} />
        ) : (
          `Can't find application with name ${applicationName}`
        )}
      </BasePage>
    );
  }
}

export const ApplicationShow = withStyles(styles)(
  connect(mapStateToProps)(ApplicationListDataWrapper(ApplicationShowRaw))
);
