import React from "react";
import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { Expansion } from "forms/Route/expansion";
import { withComponent, WithComponentProp } from "hoc/withComponent";
import { BasePage } from "pages/BasePage";
import { Namespaces } from "widgets/Namespaces";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { H4 } from "widgets/Label";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { RouteWidgets } from "pages/Route/Widget";
import { PodsTable } from "pages/Components/PodsTable";
import { ComponentBasicInfo } from "pages/Components/BasicInfo";

const styles = (theme: Theme) =>
  createStyles({
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

const mapStateToProps = (state: RootState) => {
  return {
    // xxx: state.get("xxx").get("xxx"),
  };
};

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    WithComponentProp,
    WithRoutesDataProps {}

interface State {}

class ComponentShowRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderRoutes() {
    const { httpRoutes, component, activeNamespaceName } = this.props;

    const serviceName = `${component.get("name")}.${activeNamespaceName}`;

    const routes = httpRoutes.filter((route) =>
      route.get("destinations").filter((destination) => destination.get("host").startsWith(serviceName)),
    );

    // console.log(serviceName, httpRoutes.toJS(), routes.toJS());

    return (
      <Expansion title={"routes"} defaultUnfold>
        <RouteWidgets routes={routes} activeNamespaceName={activeNamespaceName} />
      </Expansion>
    );
  }
  private renderPods() {
    const { component, activeNamespaceName } = this.props;

    return (
      <Expansion title="pods" defaultUnfold>
        <PodsTable activeNamespaceName={activeNamespaceName} pods={component.get("pods")} />
      </Expansion>
    );
  }

  private renderSecondHeaderRight() {
    const { classes, component } = this.props;

    return (
      <div className={classes.secondHeaderRight}>
        <H4 className={classes.secondHeaderRightItem}>Component {component.get("name")}</H4>
      </div>
    );
  }

  public render() {
    const { component, activeNamespaceName } = this.props;
    return (
      <BasePage
        secondHeaderRight={this.renderSecondHeaderRight()}
        secondHeaderLeft={<Namespaces />}
        leftDrawer={<ApplicationSidebar />}
      >
        <Box p={2}>
          <Expansion title={"Basic"} defaultUnfold>
            <ComponentBasicInfo component={component} activeNamespaceName={activeNamespaceName} />
          </Expansion>
          {this.renderPods()}
          {this.renderRoutes()}
        </Box>
      </BasePage>
    );
  }
}

export const ComponentShow = withStyles(styles)(
  connect(mapStateToProps)(withRoutesData(withComponent(ComponentShowRaw))),
);
