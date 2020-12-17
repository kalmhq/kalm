import { Box, Button, createStyles, Link as KMLink, Theme, WithStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import withStyles from "@material-ui/core/styles/withStyles";
import { deleteApplicationAction } from "actions/application";
import { deleteComponentAction } from "actions/component";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { push } from "connected-react-router";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { ApplicationSidebar } from "pages/Application/ApplicationSidebar";
import { renderCopyableValue } from "pages/Components/InfoComponents";
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
import { EditIcon, KalmComponentsIcon, KalmViewListIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { InfoBox } from "widgets/InfoBox";
import { KRTable } from "widgets/KRTable";
import { Subtitle1 } from "widgets/Label";
import { Namespaces } from "widgets/Namespaces";
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
  return {
    clusterInfo,
    routesMap,
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

  private getKRTableColumns() {
    return [
      { Header: "", accessor: "componentName" },
      { Header: "Pods", accessor: "pods" },
      { Header: "Type", accessor: "type" },
      { Header: "Image", accessor: "image" },
      { Header: "Actions", accessor: "actions" },
    ];
  }
  private getKRTableData() {
    const { components, classes, dispatch } = this.props;
    const data: any[] = [];
    components &&
      components.forEach((component, index) => {
        data.push({
          componentName: (
            <Box display={"flex"}>
              <Box className={classes.componentIcon} pr={2}>
                <KalmComponentsIcon fontSize={"default"} />
              </Box>
              <Box display="flex" minWidth={100}>
                <Subtitle1>{component.name}</Subtitle1>
              </Box>
            </Box>
          ),
          pods: this.getPodsStatus(component),
          type: component.workloadType,
          image: renderCopyableValue(component.image, dispatch),
          actions: this.componentControls(component),
        });
      });
    return data;
  }

  private getPodsNumber = (component: ApplicationComponentDetails): string => {
    let runningCount = 0;

    component.pods?.forEach((pod) => {
      if (pod.status === "Succeeded" || pod.status === "Running") {
        runningCount = runningCount + 1;
      }
    });

    return `${runningCount}/${component.pods.length}`;
  };

  private getPodsStatus = (component: ApplicationComponentDetails) => {
    // @ts-ignore
    let pods = [];

    component.pods?.forEach((pod, index) => {
      pods.push(getPod({ info: pod, key: index }));
    });

    return (
      <Box display={"flex"} flexDirection="row" maxWidth={100} flexWrap="wrap">
        {
          // @ts-ignore
          pods.length > 0 ? pods : "No Pods"
        }
      </Box>
    );
  };

  private componentControls = (component: ApplicationComponentDetails) => {
    const { activeNamespaceName, dispatch, canEditNamespace } = this.props;
    const appName = activeNamespaceName;
    return (
      <Box pb={2} pt={2}>
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
              {/* {components?.map((component, index) => (
                <Box pb={1} key={component.name}>
                  <ComponentPanel
                    component={component}
                    application={activeNamespace!}
                    defaultUnfold={index === 0}
                    canEdit={canEditNamespace(appName)}
                  />
                </Box>
              ))} */}
              <Box pb={1}>
                <KRTable columns={this.getKRTableColumns()} data={this.getKRTableData()} />
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
