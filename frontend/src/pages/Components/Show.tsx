import React from "react";
import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { Expansion } from "forms/Route/expansion";
import { withComponent, WithComponentProp } from "hoc/withComponent";
import { BasePage } from "pages/BasePage";
import { Namespaces } from "widgets/Namespaces";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { Body, H4 } from "widgets/Label";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { RouteWidgets } from "pages/Route/Widget";
import { PodsTable } from "pages/Components/PodsTable";
import { ComponentBasicInfo } from "pages/Components/BasicInfo";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import Immutable from "immutable";
import { Link } from "react-router-dom";

const styles = (theme: Theme) =>
  createStyles({
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
    },
    secondHeaderRightItem: {
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2),
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
  private renderNetwork() {
    const { component, activeNamespaceName } = this.props;
    const hasService = component.get("ports") && component.get("ports")!.size > 0;
    return (
      <Expansion title={"Networking"} defaultUnfold>
        <Box pb={2}>
          <Body>
            Cluster FQDN DNS:{" "}
            <strong>{hasService ? `${component.get("name")}.${activeNamespaceName}.svc.cluster.local` : "none"}</strong>
          </Body>
          <Body>
            Cluster DNS: <strong>{hasService ? `${component.get("name")}.${activeNamespaceName}` : "none"}</strong>
          </Body>
          <Body>
            Namespace DNS: <strong>{hasService ? `${component.get("name")}` : "none"}</strong>
          </Body>
        </Box>
        <VerticalHeadTable
          items={component!
            .get("ports", Immutable.List())!
            .map((port) => ({
              name: "Exposed port Name: " + port.get("name"),
              content: (
                <span>
                  Expose port <strong>{port.get("containerPort")}</strong> to cluster port{" "}
                  <strong>{port.get("servicePort") || port.get("containerPort")}</strong>
                </span>
              ),
            }))

            .toArray()}
        />
      </Expansion>
    );
  }

  private renderRoutes() {
    const { httpRoutes, component, activeNamespaceName } = this.props;

    const serviceName = `${component.get("name")}.${activeNamespaceName}`;

    const routes = httpRoutes.filter((route) =>
      route.get("destinations").filter((destination) => destination.get("host").startsWith(serviceName)),
    );

    // console.log(serviceName, httpRoutes.toJS(), routes.toJS());

    return (
      <Expansion title={"Routes"} defaultUnfold>
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
    const { classes, component, activeNamespaceName } = this.props;

    return (
      <div className={classes.secondHeaderRight}>
        <H4 className={classes.secondHeaderRightItem}>Component {component.get("name")}</H4>
        <Button
          tutorial-anchor-id="edit-component"
          component={Link}
          color="primary"
          size="small"
          variant="outlined"
          to={`/applications/${activeNamespaceName}/components/${component.get("name")}/edit`}
        >
          Edit
        </Button>
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
          {this.renderNetwork()}
          {this.renderRoutes()}
        </Box>
      </BasePage>
    );
  }
}

export const ComponentShowPage = withStyles(styles)(
  connect(mapStateToProps)(withRoutesData(withComponent(ComponentShowRaw))),
);
