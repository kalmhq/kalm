import { Box, Button, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import { deleteComponentAction, loadApplicationAction } from "actions/application";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { api } from "api";
import { Expansion } from "forms/Route/expansion";
import { MaterialTableProps } from "material-table";
import { generateQueryForPods } from "pages/Application/Log";
import { ComponentStatus } from "pages/Components/Status";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Application, ApplicationComponentDetails, PodStatus } from "types/application";
import { formatTimeDistance } from "utils";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { KappConsoleIcon, KappLogIcon } from "widgets/Icon";
import { IconButtonWithTooltip, IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { H5 } from "widgets/Label";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { KTable } from "widgets/Table";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    flexWrapper: {
      display: "flex",
      alignItems: "center",
    },
    componentContainer: {
      // background: "#f5f5f5",
      width: "100%",
    },
  });

const mapStateToProps = (state: RootState) => {
  return {
    // xxx: state.get("xxx").get("xxx"),
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  application: Application;
  component: ApplicationComponentDetails;
}

interface State {}

interface PodRowData extends PodStatus {
  index: number;
}

class ComponentPanelRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private getPodsNumber = (): string => {
    const { component } = this.props;
    let runningCount = 0;

    component.get("pods").forEach((pod) => {
      if (pod.get("status") === "Succeeded" || pod.get("status") === "Running") {
        runningCount = runningCount + 1;
      }
    });

    return `${runningCount}/${component.get("pods").size}`;
  };

  private getData = () => {
    const { component } = this.props;
    const data: PodRowData[] = [];

    component.get("pods").forEach((pod, index) => {
      const rowData = pod as PodRowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  private renderPodName = (pod: PodRowData) => {
    return pod.get("name");
  };

  private renderPodNode = (pod: PodRowData) => {
    return pod.get("node");
  };

  private renderPodRestarts = (pod: PodRowData) => {
    return pod.get("restarts");
  };

  private renderPodStatusText = (pod: PodRowData) => {
    return pod.get("statusText");
  };

  private renderPodAGE = (pod: PodRowData) => {
    return formatTimeDistance(pod.get("createTimestamp"));
  };

  private renderPodCPU = (pod: PodRowData) => {
    return <SmallCPULineChart data={pod.get("metrics").get("cpu")!} />;
  };

  private renderPodMemory = (pod: PodRowData) => {
    return <SmallMemoryLineChart data={pod.get("metrics").get("memory")!} />;
  };

  private renderPodActions = (pod: PodRowData) => {
    const { application, dispatch } = this.props;
    const hasWriterRole = true;
    const containerNames = pod
      .get("containers")
      .map((container) => container.get("name"))
      .toArray();
    return (
      <>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          size="small"
          tooltipTitle="Log"
          to={
            `/applications/${application.get("name")}/logs?` +
            generateQueryForPods(
              application.get("name"),
              [[pod.get("name"), containerNames[0]]],
              [pod.get("name"), containerNames[0]],
            )
          }
        >
          <KappLogIcon />
        </IconLinkWithToolTip>
        {hasWriterRole ? (
          <IconLinkWithToolTip
            onClick={() => {
              blinkTopProgressAction();
            }}
            tooltipTitle="Shell"
            size="small"
            to={
              `/applications/${application.get("name")}/shells?` +
              generateQueryForPods(
                application.get("name"),
                [[pod.get("name"), containerNames[0]]],
                [pod.get("name"), containerNames[0]],
              )
            }
          >
            <KappConsoleIcon />
          </IconLinkWithToolTip>
        ) : null}
        {hasWriterRole ? (
          <IconButtonWithTooltip
            tooltipTitle="Delete"
            size="small"
            onClick={async () => {
              blinkTopProgressAction();

              try {
                await api.deletePod(application.get("name"), pod.get("name"));
                dispatch(setSuccessNotificationAction(`Delete pod ${pod.get("name")} successfully`));
                // reload
                dispatch(loadApplicationAction(application.get("name")));
              } catch (e) {
                dispatch(setErrorNotificationAction(e.response.data.message));
              }
            }}
          >
            <DeleteIcon />
          </IconButtonWithTooltip>
        ) : null}
      </>
    );
  };

  private renderPodWarnings: MaterialTableProps<PodRowData>["detailPanel"] = [
    (pod: PodRowData) => {
      const hasWarning = !pod.get("isTerminating") && pod.get("warnings").size > 0;
      return {
        disabled: !hasWarning,
        icon: () => (
          <Box p={1} fontSize={0}>
            {this.renderPodStatus(pod)}
          </Box>
        ),
        render: (podRowData: PodRowData) => {
          return (
            <Box p={2}>
              {podRowData
                .get("warnings")
                .map((w, index) => {
                  return (
                    <Box color="error.main" key={index}>
                      {index + 1}. {w.get("message")}
                    </Box>
                  );
                })
                .toArray()}
            </Box>
          );
        },
      };
    },
  ];

  private getColumns = (): MaterialTableProps<PodRowData>["columns"] => {
    return [
      { title: "Name", sorting: false, render: this.renderPodName },
      { title: "Node", sorting: false, render: this.renderPodNode },
      { title: "Restarts", sorting: false, render: this.renderPodRestarts },
      { title: "Status", sorting: false, render: this.renderPodStatusText },
      { title: "AGE", sorting: false, render: this.renderPodAGE },
      { title: "CPU", sorting: false, render: this.renderPodCPU },
      { title: "Memory", sorting: false, render: this.renderPodMemory },
      { title: "", sorting: false, render: this.renderPodActions },
    ];
  };

  private renderComponentDetail = () => {
    const { application, dispatch, component } = this.props;
    return (
      <Box display="flex" flexDirection="column" width={1}>
        <Box pb={2} pt={2}>
          <Button
            component={(props: any) => <Link {...props} />}
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            variant="outlined"
            to={`/applications/${application.get("name")}/components/${component.get("name")}`}
          >
            View More Details
          </Button>

          <Button
            component={(props: any) => <Link {...props} />}
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            variant="outlined"
            to={`/applications/${application.get("name")}/components/${component.get("name")}/edit`}
          >
            Edit
          </Button>

          <Button
            variant="outlined"
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(deleteComponentAction(component.get("name"), application.get("name")));
            }}
          >
            Delete
          </Button>
        </Box>

        <VerticalHeadTable
          items={[
            {
              name: "Created At",
              content: "TODO",
            },
            { name: "Name", content: component.get("name") },
            { name: "Namespace", content: application.get("name") },
            { name: "Image", content: component.get("image") },
            { name: "Workload Type", content: component.get("workloadType") },
            { name: "Update Strategy", content: component.get("restartStrategy") },
            { name: "Pod Status", content: "TODO: Running: 1, Pending: 1, Error: 2" },
            { name: "CPU", content: "TODO: Running: 1, Pending: 1, Error: 2" },
            { name: "Memory", content: "TODO: Running: 1, Pending: 1, Error: 2" },
          ]}
        />

        <Box pt={2} pb={2}>
          <KTable
            options={{ padding: "dense", paging: component.get("pods").size > 20 }}
            columns={this.getColumns()}
            data={this.getData()}
            detailPanel={this.renderPodWarnings}
          />
        </Box>
      </Box>
    );
  };

  private renderPodStatus = (pod: PodStatus) => {
    if (pod.get("isTerminating")) {
      return <PendingBadge />;
    }

    switch (pod.get("status")) {
      case "Running": {
        return <SuccessBadge />;
      }
      case "Pending": {
        return <PendingBadge />;
      }
      case "Succeeded": {
        return <SuccessBadge />;
      }
      case "Failed": {
        return <ErrorBadge />;
      }
    }

    return <SuccessBadge />;
  };

  public render = () => {
    const { component } = this.props;

    return (
      <Expansion
        title={
          <Grid container spacing={2}>
            <Grid item md={2}>
              <Box display="flex">
                <ComponentStatus component={component} /> <H5>{component.get("name")}</H5>
              </Box>
            </Grid>
            <Grid item md={2}>
              <span>Pods:</span> <span>{this.getPodsNumber()}</span>
            </Grid>
            <Grid item md={2}>
              {component.get("image")}
            </Grid>
            <Grid item md={2}>
              {component.get("workloadType")}
            </Grid>
          </Grid>
        }
      >
        {this.renderComponentDetail()}
      </Expansion>
    );
  };
}

export const ComponentPanel = withStyles(styles)(connect(mapStateToProps)(ComponentPanelRaw));
