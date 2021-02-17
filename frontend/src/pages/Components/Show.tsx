import { Box, Button, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { deleteComponentAction } from "actions/component";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { api } from "api";
import { push } from "connected-react-router";
import { withComponent, WithComponentProp } from "hoc/withComponent";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { BasePage } from "pages/BasePage";
import { ComponentBasicInfo } from "pages/Components/BasicInfo";
import { JobsTable } from "pages/Components/JobsTables";
import { PodsTable } from "pages/Components/PodsTable";
import { RouteWidgets } from "pages/Route/Widget";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import CustomButton from "theme/Button";
import { ComponentLikePort, WorkloadType } from "types/componentTemplate";
import { Expansion } from "widgets/expansion";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { Body, H6 } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";

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
    rightBorder: {
      borderRight: `1px dashed ${theme.palette.divider}`,
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

const ComponentShowRaw: React.FC<Props> = (props) => {
  const { classes, component, httpRoutes, activeNamespaceName, canEditNamespace, dispatch } = props;

  const getServicePort = (port: ComponentLikePort) => {
    return port.servicePort || port.containerPort;
  };

  const renderStatefulSetNetwork = () => {
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
                  <strong>{getServicePort(port)}</strong>
                </span>
              ),
            }))}
          />
        )}
      </Expansion>
    );
  };

  const renderCommonNetwork = () => {
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
  };

  const renderNetwork = () => {
    if (props.component.workloadType === "statefulset") {
      return renderStatefulSetNetwork();
    }

    return renderCommonNetwork();
  };

  const renderRoutes = () => {
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
  };
  const renderPods = () => {
    return (
      <Expansion title="pods" defaultUnfold>
        <Box p={2}>
          <PodsTable
            activeNamespaceName={activeNamespaceName}
            component={component}
            pods={component.pods}
            workloadType={component.workloadType as WorkloadType}
            canEdit={canEditNamespace(activeNamespaceName)}
          />
        </Box>
      </Expansion>
    );
  };

  const renderJobs = () => {
    return (
      <Expansion title="Jobs" defaultUnfold>
        <JobsTable
          activeNamespaceName={activeNamespaceName}
          component={component}
          jobs={component.jobs!}
          workloadType={component.workloadType as WorkloadType}
          canEdit={canEditNamespace(activeNamespaceName)}
        />
      </Expansion>
    );
  };

  const renderSecondHeaderRight = () => {
    return (
      <div className={classes.secondHeaderRight}>
        {component.workloadType === "cronjob" && (
          <CustomButton
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
          </CustomButton>
        )}

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
        {canEditNamespace(activeNamespaceName) ? (
          <DeleteButtonWithConfirmPopover
            iconSize="small"
            popupId="delete-pod-popup"
            text="Delete"
            useText={true}
            targetText={component.name}
            popupTitle="DELETE COMPONENT?"
            confirmedAction={async () => {
              await dispatch(deleteComponentAction(component.name, activeNamespaceName));
              dispatch(push("/applications/" + activeNamespaceName + "/components"));
              dispatch(setSuccessNotificationAction("Delete component successfully"));
            }}
          />
        ) : null}
      </div>
    );
  };

  return (
    <BasePage
      secondHeaderRight={renderSecondHeaderRight()}
      secondHeaderLeft={<Namespaces />}
      leftDrawer={<ApplicationSidebar />}
    >
      <Box p={2}>
        <Expansion title={"Basic"} defaultUnfold>
          <Box p={2} pb={4}>
            <Grid container spacing={4}>
              <Grid item md={3} className={classes.rightBorder}>
                <ComponentBasicInfo component={component} activeNamespaceName={activeNamespaceName} setName="first" />
              </Grid>
              <Grid item md={4} className={classes.rightBorder}>
                <ComponentBasicInfo component={component} activeNamespaceName={activeNamespaceName} setName="second" />
              </Grid>
              <Grid item md={5}>
                <ComponentBasicInfo component={component} activeNamespaceName={activeNamespaceName} setName="third" />
              </Grid>
            </Grid>
          </Box>
        </Expansion>
        {!!component.jobs && renderJobs()}
        {renderPods()}
        {renderNetwork()}
        {renderRoutes()}
      </Box>
    </BasePage>
  );
};

export const ComponentShowPage = withStyles(styles)(
  withUserAuth(connect(mapStateToProps)(withRoutesData(withComponent(ComponentShowRaw)))),
);
