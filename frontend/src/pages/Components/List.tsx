import { Box, Button, createStyles, Link as KMLink, Theme, WithStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import withStyles from "@material-ui/core/styles/withStyles";
import { deleteApplicationAction } from "actions/application";
import { deleteComponentAction } from "actions/component";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { api } from "api";
import { push } from "connected-react-router";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { getPodLogQuery } from "pages/Application/Log";
import { renderCopyableImageName } from "pages/Components/InfoComponents";
import { getPod } from "pages/Components/Pod";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { ApplicationComponentDetails, ApplicationDetails } from "types/application";
import sc from "utils/stringConstants";
import { CustomizedButton } from "widgets/Button";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { EmptyInfoBox } from "widgets/EmptyInfoBox";
import { EditIcon, KalmComponentsIcon, KalmViewListIcon, LockIcon, PlayIcon } from "widgets/Icon";
import { IconButtonWithTooltip, IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { Namespaces } from "widgets/Namespaces";
import { BasePage } from "../BasePage";
import { RoutesPopover } from "widgets/RoutesPopover";

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

interface Props
  extends WithStyles<typeof styles>,
    WithUserAuthProps,
    WithNamespaceProps,
    ReturnType<typeof mapStateToProps> {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  // TODO correct here
  deletingComponentItem?: ApplicationDetails;
}

class ComponentRaw extends React.PureComponent<Props, State> {
  private defaultState = {
    isDeleteConfirmDialogOpen: false,
    deletingComponentItem: undefined,
  };

  constructor(props: Props) {
    super(props);
    this.state = this.defaultState;
  }

  private closeDeleteConfirmDialog = () => {
    this.setState({ isDeleteConfirmDialogOpen: false });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen, deletingComponentItem } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`${sc.ARE_YOU_SURE_PREFIX} this Application(${deletingComponentItem?.name})?`}
        content="This application is already disabled. You will lost this application config, and this action is irrevocable."
        onAgree={this.confirmDelete}
      />
    );
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingComponentItem } = this.state;
      if (deletingComponentItem) {
        await dispatch(deleteApplicationAction(deletingComponentItem.name));
        await dispatch(setSuccessNotificationAction("Successfully delete an application"));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderSecondHeaderRight() {
    const { activeNamespaceName, canEditNamespace } = this.props;

    return (
      <>
        {canEditNamespace(activeNamespaceName) && (
          <Button
            tutorial-anchor-id="add-component-button"
            component={Link}
            color="primary"
            size="small"
            variant="outlined"
            to={`/applications/${activeNamespaceName}/components/new`}
          >
            Add Component
          </Button>
        )}
      </>
    );
  }

  private renderEmpty() {
    const { dispatch, activeNamespaceName, canEditNamespace } = this.props;

    return (
      <EmptyInfoBox
        image={<KalmComponentsIcon style={{ height: 120, width: 120, color: indigo[200] }} />}
        title={"This App doesn’t have any Components"}
        content="Components are the fundamental building blocks of your Application. Each Component corresponds to a single image, and typically represents a service or a cronjob."
        button={
          canEditNamespace(activeNamespaceName) && (
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
          )
        }
      />
    );
  }

  private renderInfoBox() {
    const title = "References";

    const options = [
      {
        title: (
          <KMLink href="https://kalm.dev/docs/next/crd/component" target="_blank">
            Component CRD
          </KMLink>
        ),
        content: "",
      },
    ];

    return <InfoBox title={title} options={options} />;
  }
  private renderProtected(component: ApplicationComponentDetails) {
    const { activeNamespaceName, canEditNamespace } = this.props;
    const appName = activeNamespaceName;
    return (
      <Box>
        {component.protectedEndpoint ? (
          <IconLinkWithToolTip
            disabled={!canEditNamespace(appName)}
            onClick={() => {
              blinkTopProgressAction();
            }}
            size="small"
            tooltipTitle="Protected"
            to={`/applications/${appName}/components/${component.name}/edit#Access`}
          >
            <LockIcon fontSize="small" color="default" />
          </IconLinkWithToolTip>
        ) : (
          ""
        )}
      </Box>
    );
  }

  private getKRTableColumns() {
    return [
      { Header: "", accessor: "protected" },
      { Header: "", accessor: "componentName" },
      { Header: "Pods", accessor: "pods" },
      { Header: "Type", accessor: "type" },
      { Header: "Image", accessor: "image" },
      { Header: "Routes", accessor: "routes" },
      { Header: "Actions", accessor: "actions" },
    ];
  }
  private getKRTableData() {
    const { components, activeNamespaceName } = this.props;
    const data: any[] = [];
    components &&
      components.forEach((component, index) => {
        data.push({
          protected: this.renderProtected(component),
          componentName: (
            <Box display={"flex"}>
              <Box display="flex" minWidth={100}>
                <KMLink component={Link} to={`/applications/${activeNamespaceName}/components/${component.name}`}>
                  {component.name}
                </KMLink>
              </Box>
            </Box>
          ),
          pods: this.getPodsStatus(component, activeNamespaceName),
          type: component.workloadType,
          image: this.renderImage(component.image),
          routes: this.renderExternalAccesses(component, activeNamespaceName),
          actions: this.componentControls(component),
        });
      });
    return data;
  }

  private getRoutes = (componentName: string, applicationName: string) => {
    const { httpRoutes } = this.props;
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
    console.log(applicationRoutes);
    return applicationRoutes;
  };

  private renderImage = (imageName: string) => {
    const { registries, dispatch } = this.props;
    const hosts = registries.map((r) => {
      return r.host.toLowerCase().replace("https://", "").replace("http://", "");
    });
    return renderCopyableImageName(imageName, dispatch, hosts);
  };

  private renderExternalAccesses = (component: ApplicationComponentDetails, applicationName: string) => {
    const { canViewNamespace, canEditNamespace } = this.props;
    const applicationRoutes = this.getRoutes(component.name, applicationName);

    if (applicationRoutes && applicationRoutes.length > 0 && canViewNamespace(applicationName)) {
      return (
        <RoutesPopover
          applicationRoutes={applicationRoutes}
          applicationName={applicationName}
          canEdit={canEditNamespace(applicationName)}
        />
      );
    } else {
      return "-";
    }
  };

  private getPodsStatus = (component: ApplicationComponentDetails, activeNamespaceName: string) => {
    let pods: React.ReactElement[] = [];

    component.pods?.forEach((pod, index) => {
      if (pod.statusText !== "Terminated: Completed") {
        pods.push(
          <IconLinkWithToolTip
            onClick={() => {
              blinkTopProgressAction();
            }}
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

  private componentControls = (component: ApplicationComponentDetails) => {
    const { activeNamespaceName, dispatch, canEditNamespace } = this.props;
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
        {canEditNamespace(activeNamespaceName) ? (
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
        ) : null}

        {canEditNamespace(activeNamespaceName) ? (
          <DeleteButtonWithConfirmPopover
            iconSize="small"
            popupId="delete-pod-popup"
            popupTitle="DELETE COMPONENT?"
            confirmedAction={async () => {
              await dispatch(deleteComponentAction(component.name, activeNamespaceName));
              dispatch(setSuccessNotificationAction("Delete component successfully"));
            }}
          />
        ) : null}
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

  public render() {
    const { components } = this.props;
    return (
      <BasePage
        secondHeaderRight={this.renderSecondHeaderRight()}
        secondHeaderLeft={<Namespaces />}
        leftDrawer={<ApplicationSidebar />}
      >
        {this.renderDeleteConfirmDialog()}

        <Box p={2}>
          {components && components.length > 0 ? (
            <>
              <Box pb={1}>
                <KRTable
                  showTitle={true}
                  title="Components"
                  columns={this.getKRTableColumns()}
                  data={this.getKRTableData()}
                />
              </Box>
              {this.renderInfoBox()}
            </>
          ) : (
            this.renderEmpty()
          )}
        </Box>
      </BasePage>
    );
  }
}

export const ComponentListPage = withStyles(styles)(
  withNamespace(withUserAuth(connect(mapStateToProps)(ComponentRaw))),
);
