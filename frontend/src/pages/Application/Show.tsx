import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { withNamespace, withNamespaceProps } from "permission/Namespace";
import React from "react";
import { connect } from "react-redux";
import { RouteChildrenProps } from "react-router-dom";
import { Loading } from "../../widgets/Loading";
import { BasePage } from "../BasePage";
import { Details } from "./Detail";
import { ApplicationItemDataWrapper, WithApplicationItemDataProps } from "./ItemDataWrapper";
import { H4 } from "../../widgets/Label";
import { CustomizedButton } from "widgets/Button";
import { push } from "connected-react-router";

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

interface Props
  extends WithApplicationItemDataProps,
    withNamespaceProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    RouteChildrenProps<{ applicationName: string }> {}

class ApplicationShowRaw extends React.PureComponent<Props> {
  private renderSecondHeaderRight() {
    const { classes, dispatch, applicationName } = this.props;
    return (
      <div className={classes.secondHeaderRight}>
        <H4 className={classes.secondHeaderRightItem}>Application Details</H4>
        <CustomizedButton
          color="primary"
          size="large"
          className={classes.secondHeaderRightItem}
          onClick={() => {
            dispatch(push(`/applications/${applicationName}/edit`));
          }}>
          Edit
        </CustomizedButton>
      </div>
    );
  }

  public render() {
    const { isLoading, application, applicationName, dispatch } = this.props;
    // const hasWriterRole = hasRole("writer");
    return (
      <BasePage secondHeaderRight={this.renderSecondHeaderRight()}>
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
