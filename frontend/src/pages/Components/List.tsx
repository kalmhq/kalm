import { Box, createStyles, Link as KMLink, Theme, WithStyles } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import withStyles from "@material-ui/core/styles/withStyles";
import { deleteApplicationAction } from "actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { api } from "api";
import { push } from "connected-react-router";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { getPodLogQuery } from "pages/Application/Log";
import { ComponentCPUChart, ComponentMemoryChart } from "pages/Components/Chart";
import { getPod } from "pages/Components/Pod";
import React, { useState } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "store";
import CustomButton from "theme/Button";
import { ApplicationComponentDetails, ApplicationDetails } from "types/application";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { EditIcon, KalmComponentsIcon, KalmViewListIcon, LockIcon, PlayIcon } from "widgets/Icon";
import { IconButtonWithTooltip, IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { Namespaces } from "widgets/Namespaces";
import { RoutesPopover } from "widgets/RoutesPopover";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    emptyWrapper: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      paddingTop: "110px",
    },
    componentIcon: {
      height: "1.25rem",
      color: theme.palette.type === "light" ? theme.palette.primary.light : "#FFFFFF",
    },
  });

const mapStateToProps = (state: RootState) => {
  const routesMap = state.routes.httpRoutes;
  const clusterInfo = state.cluster.info;
  const httpRoutes = state.routes.httpRoutes;
  const registriesState = state.registries;
  return {
    clusterInfo,
    routesMap,
    httpRoutes,
    registries: registriesState.registries,
  };
};

interface Props extends WithStyles<typeof styles>, WithNamespaceProps, ReturnType<typeof mapStateToProps> {}

const ComponentRaw: React.FC<Props> = (props) => {
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [deletingComponentItem] = useState<ApplicationDetails | undefined>(undefined);

  const closeDeleteConfirmDialog = () => {
    setIsDeleteConfirmDialogOpen(false);
  };

  const renderDeleteConfirmDialog = () => {
    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={closeDeleteConfirmDialog}
        title={`${sc.ARE_YOU_SURE_PREFIX} this Application(${deletingComponentItem?.name})?`}
        content="This application is already disabled. You will lost this application config, and this action is irrevocable."
        onAgree={confirmDelete}
      />
    );
  };

  const confirmDelete = async () => {
    const { dispatch } = props;
    try {
      if (deletingComponentItem) {
        await deleteApplicationAction(deletingComponentItem.name);
        await dispatch(setSuccessNotificationAction("Successfully delete an application"));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  const renderSecondHeaderRight = () => {
    const { activeNamespaceName } = props;

    return (
      <>
        <CustomButton
          component={Link}
          color="primary"
          size="small"
          variant="outlined"
          to={`/applications/${activeNamespaceName}/components/new`}
        >
          Add Component
        </CustomButton>
      </>
    );
  };

  const renderEmpty = () => {
    const { dispatch, activeNamespaceName } = props;

    return (
      <EmptyInfoBox
        image={<KalmComponentsIcon style={{ height: 120, width: 120, color: grey[300] }} />}
        title={"This App doesn’t have any Components"}
        content="Components are the fundamental building blocks of your Application. Each Component corresponds to a single image, and typically represents a service or a cronjob."
        button={
          <CustomizedButton
            variant="contained"
            color="primary"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(push(`/applications/${activeNamespaceName}/components/new`));
            }}
          >
            Add Component
          </CustomizedButton>
        }
      />
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderInfoBox = () => {
    const title = "References";

    const options = [
      {
        title: (
          <KMLink href="https://docs.kalm.dev/crd/component" target="_blank">
            Component CRD
          </KMLink>
        ),
        content: "",
      },
    ];

    return <InfoBox title={title} options={options} />;
  };
  const renderProtected = (component: ApplicationComponentDetails) => {
    const { activeNamespaceName } = props;
    const appName = activeNamespaceName;
    return (
      <Box>
        {component.protectedEndpoint ? (
          <IconLinkWithToolTip
            disabled={false}
            onClick={() => {
              blinkTopProgressAction();
            }}
            size="small"
            tooltipTitle="External access is restricted through SSO"
            to={`/applications/${appName}/components/${component.name}/edit#Access`}
          >
            <LockIcon fontSize="small" color="default" />
          </IconLinkWithToolTip>
        ) : (
          ""
        )}
      </Box>
    );
  };

  const getKRTableColumns = () => {
    return [
      { Header: "", accessor: "protected" },
      { Header: "", accessor: "componentName" },
      { Header: "Pods", accessor: "pods" },
      { Header: "CPU", accessor: "cpu" },
      { Header: "Memory", accessor: "memory" },
      { Header: "Type", accessor: "type" },
      // { Header: "Image", accessor: "image" },
      { Header: "Routes", accessor: "routes" },
      { Header: "Actions", accessor: "actions" },
    ];
  };
  const getKRTableData = () => {
    const { components, activeNamespaceName } = props;
    const data: any[] = [];
    components &&
      components.forEach((component, index) => {
        data.push({
          protected: renderProtected(component),
          componentName: (
            <Box display={"flex"}>
              <Box display="flex" minWidth={100}>
                <KMLink component={Link} to={`/applications/${activeNamespaceName}/components/${component.name}`}>
                  {component.name}
                </KMLink>
              </Box>
            </Box>
          ),
          pods: getPodsStatus(component, activeNamespaceName),
          cpu: renderCPU(component),
          memory: renderMemory(component),
          type: component.workloadType,
          // image: renderImage(component.image),
          routes: renderExternalAccesses(component, activeNamespaceName),
          actions: componentControls(component),
        });
      });
    return data;
  };

  const getRoutes = (componentName: string, applicationName: string) => {
    const { httpRoutes } = props;
    const applicationRoutes = httpRoutes.filter((x) => {
      let isCurrent = false;
      x.destinations.map((target) => {
        const hostInfos = target.host.split(".");
        if (
          hostInfos[0] &&
          hostInfos[0].startsWith(componentName) &&
          hostInfos[1] &&
          hostInfos[1].startsWith(applicationName)
        ) {
          isCurrent = true;
        }
        return target;
      });
      return isCurrent;
    });
    return applicationRoutes;
  };

  const renderCPU = (component: ApplicationComponentDetails) => {
    return <ComponentCPUChart component={component} />;
  };

  const renderMemory = (component: ApplicationComponentDetails) => {
    return <ComponentMemoryChart component={component} />;
  };

  const renderExternalAccesses = (component: ApplicationComponentDetails, applicationName: string) => {
    const applicationRoutes = getRoutes(component.name, applicationName);

    if (applicationRoutes && applicationRoutes.length > 0) {
      return <RoutesPopover applicationRoutes={applicationRoutes} applicationName={applicationName} canEdit={true} />;
    } else {
      return "-";
    }
  };

  const getPodsStatus = (component: ApplicationComponentDetails, activeNamespaceName: string) => {
    let pods: React.ReactElement[] = [];

    component.pods?.forEach((pod, index) => {
      if (pod.statusText !== "Terminated: Completed") {
        pods.push(
          <IconLinkWithToolTip
            onClick={() => {
              blinkTopProgressAction();
            }}
            key={index}
            size="small"
            tooltipTitle={`${pod.name} ${pod.statusText}`}
            target="_blank"
            rel="noopener noreferrer"
            to={`/applications/${activeNamespaceName}/logs?` + getPodLogQuery(activeNamespaceName, pod)}
          >
            {getPod({ info: pod, key: index })}
          </IconLinkWithToolTip>,
        );
      }
    });

    return (
      <Box display={"flex"} flexDirection="row" maxWidth={100} flexWrap="wrap">
        {pods.length > 0 ? (
          pods
        ) : (
          <Box width={12} display={"flex"} flexDirection="row" justifyContent={"center"}>
            -
          </Box>
        )}
      </Box>
    );
  };

  const componentControls = (component: ApplicationComponentDetails) => {
    const { activeNamespaceName, dispatch } = props;
    const appName = activeNamespaceName;
    return (
      <Box>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          size="small"
          tooltipTitle="Details"
          to={`/applications/${appName}/components/${component.name}`}
        >
          <KalmViewListIcon />
        </IconLinkWithToolTip>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          tooltipTitle="Edit"
          size="small"
          to={`/applications/${appName}/components/${component.name}/edit`}
        >
          <EditIcon />
        </IconLinkWithToolTip>

        {component.workloadType === "cronjob" ? (
          <IconButtonWithTooltip
            onClick={async () => {
              blinkTopProgressAction();
              try {
                await api.triggerApplicationComponentJob(appName, component.name);
                dispatch(setSuccessNotificationAction(`Trigger Cronjob ${component.name} successful!`));
              } catch (error) {
                dispatch(setErrorNotificationAction(`Trigger Cronjob ${component.name} failed: ${error}`));
              }
            }}
            tooltipTitle="Trigger"
            size="small"
          >
            <PlayIcon />
          </IconButtonWithTooltip>
        ) : null}
      </Box>
    );
  };

  const { components } = props;
  return (
    <BasePage
      secondHeaderRight={renderSecondHeaderRight()}
      secondHeaderLeft={<Namespaces />}
      leftDrawer={<ApplicationSidebar />}
    >
      {renderDeleteConfirmDialog()}

      <Box p={2}>
        {components && components.length > 0 ? (
          <>
            <Box pb={1}>
              <KRTable showTitle={true} title="Components" columns={getKRTableColumns()} data={getKRTableData()} />
            </Box>
            {/* {renderInfoBox()} */}
          </>
        ) : (
          renderEmpty()
        )}
      </Box>
    </BasePage>
  );
};

export const ComponentListPage = withStyles(styles)(withNamespace(connect(mapStateToProps)(ComponentRaw)));
