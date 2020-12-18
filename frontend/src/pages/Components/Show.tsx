import { Box, Button, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { withComponent, WithComponentProp } from "hoc/withComponent";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { BasePage } from "pages/BasePage";
import { ComponentBasicInfo } from "pages/Components/BasicInfo";
import { PodsTable } from "pages/Components/PodsTable";
import { RouteWidgets } from "pages/Route/Widget";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { ComponentLikePort, WorkloadType } from "types/componentTemplate";
import { Expansion } from "widgets/expansion";
import { Body, H6 } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { api } from "api";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";

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
  return {};
};

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    WithComponentProp,
    WithUserAuthProps,
    WithRoutesDataProps {}

interface State {}

class ComponentShowRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private getServicePort = (port: ComponentLikePort) => {
    return port.servicePort || port.containerPort;
  };

  private renderStatefulSetNetwork() {
    const { component, activeNamespaceName } = this.props;
    const hasService = component.ports && component.ports!.length > 0;

    return (
      <Expansion title={"Networking"} defaultUnfold>
        <Box p={2}>
          {component.pods.map((pod) => (
            <Box key={pod.name} mb={2}>
              <H6>{pod.name}</H6>
              <Body>
                Cluster FQDN DNS:{" "}
                <strong>
                  {hasService
                    ? `${pod.name}.${component.name}-headless.${activeNamespaceName}.svc.cluster.local`
                    : "none"}
                </strong>
              </Body>
              <Body>
                Cluster DNS:{" "}
                <strong>{hasService ? `${pod.name}.${component.name}-headless.${activeNamespaceName}` : "none"}</strong>
              </Body>
              <Body>
                Namespace DNS: <strong>{hasService ? `${pod.name}.${component.name}-headless` : "none"}</strong>
              </Body>
            </Box>
          ))}
        </Box>
        {component.ports && (
          <VerticalHeadTable
            items={component.ports?.map((port) => ({
              name: "Exposed port: " + port.protocol,
              content: (
                <span>
                  Expose port <strong>{port.containerPort}</strong> to cluster port{" "}
                  <strong>{this.getServicePort(port)}</strong>
                </span>
              ),
            }))}
          />
        )}
      </Expansion>
    );
  }

  private renderCommonNetwork() {
    const { component, activeNamespaceName } = this.props;
    const hasService = component.ports && component.ports!.length > 0;

    return (
      <Expansion title={"Networking"} defaultUnfold>
        <Box p={2}>
          <Body>
            Cluster FQDN DNS:{" "}
            <strong>{hasService ? `${component.name}.${activeNamespaceName}.svc.cluster.local` : "none"}</strong>
          </Body>
          <Body>
            Cluster DNS: <strong>{hasService ? `${component.name}.${activeNamespaceName}` : "none"}</strong>
          </Body>
          <Body>
            Namespace DNS: <strong>{hasService ? `${component.name}` : "none"}</strong>
          </Body>
        </Box>
        {component.ports && (
          <VerticalHeadTable
            items={component.ports?.map((port) => ({
              name: "Exposed port: " + port.protocol,
              content: (
                <span>
                  Expose port <strong>{port.containerPort}</strong> to cluster port{" "}
                  <strong>{port.servicePort || port.containerPort}</strong>
                </span>
              ),
            }))}
          />
        )}
      </Expansion>
    );
  }

  private renderNetwork() {
    if (this.props.component.workloadType === "statefulset") {
      return this.renderStatefulSetNetwork();
    }

    return this.renderCommonNetwork();
  }

  private renderRoutes() {
    const { httpRoutes, component, activeNamespaceName, canEditNamespace } = this.props;

    const serviceName = `${component.name}`;

    const routes = httpRoutes.filter(
      (route) =>
        route.destinations.filter((destination) => destination.host.startsWith(serviceName + "." + activeNamespaceName))
          .length > 0,
    );
    return (
      <Expansion title={"Routes"} defaultUnfold>
        <Box p={2}>
          <RouteWidgets routes={routes} canEdit={canEditNamespace(activeNamespaceName)} />
        </Box>
      </Expansion>
    );
  }
  private renderPods() {
    const { component, activeNamespaceName, canEditNamespace } = this.props;

    return (
      <Expansion title="pods" defaultUnfold>
        <PodsTable
          activeNamespaceName={activeNamespaceName}
          pods={component.pods}
          workloadType={component.workloadType as WorkloadType}
          canEdit={canEditNamespace(activeNamespaceName)}
        />
      </Expansion>
    );
  }

  private renderSecondHeaderRight() {
    const { classes, component, activeNamespaceName, canEditNamespace, dispatch } = this.props;

    return (
      <div className={classes.secondHeaderRight}>
        <H6 className={classes.secondHeaderRightItem}>Component {component.name}</H6>
        {canEditNamespace(activeNamespaceName) && (
          <Button
            tutorial-anchor-id="edit-component"
            component={Link}
            color="primary"
            size="small"
            className={classes.secondHeaderRightItem}
            variant="outlined"
            to={`/applications/${activeNamespaceName}/components/${component.name}/edit`}
          >
            Edit
          </Button>
        )}

        {component.workloadType === "cronjob" && (
          <Button
            color="primary"
            size="small"
            variant="outlined"
            onClick={async () => {
              try {
                await api.triggerApplicationComponentJob(activeNamespaceName, component.name);
                dispatch(setSuccessNotificationAction(`Trigger Cronjob ${component.name} successful!`));
              } catch (error) {
                dispatch(setErrorNotificationAction(`Trigger Cronjob ${component.name} failed: ${error}`));
              }
            }}
          >
            Run Once
          </Button>
        )}
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
  withUserAuth(connect(mapStateToProps)(withRoutesData(withComponent(ComponentShowRaw)))),
);
