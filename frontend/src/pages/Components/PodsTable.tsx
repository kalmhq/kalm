import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { loadApplicationAction } from "actions/application";
import { loadComponentsAction } from "actions/component";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { api } from "api";
import { getPodLogQuery } from "pages/Application/Log";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { PodStatus } from "types/application";
import { WorkloadType } from "types/componentTemplate";
import { formatTimeDistance } from "utils/date";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { KalmConsoleIcon, KalmLogIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover, IconWithPopover } from "widgets/IconWithPopover";
import { KRTable } from "widgets/KRTable";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  activeNamespaceName: string;
  workloadType: WorkloadType;
  pods: PodStatus[];
  canEdit?: boolean;
}

interface State {}

class PodsTableRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderPodName = (pod: PodStatus) => {
    return pod.name;
  };

  private renderPodNode = (pod: PodStatus) => {
    return pod.node;
  };

  private renderPodRestarts = (pod: PodStatus) => {
    return pod.restarts;
  };

  private renderPodStatusText = (pod: PodStatus) => {
    return pod.statusText;
  };

  private renderPodAGE = (pod: PodStatus) => {
    return formatTimeDistance(pod.createTimestamp);
  };

  private renderPodCPU = (pod: PodStatus) => {
    return <SmallCPULineChart data={pod.metrics.cpu!} />;
  };

  private renderPodMemory = (pod: PodStatus) => {
    return <SmallMemoryLineChart data={pod.metrics.memory!} />;
  };

  private renderPodActions = (pod: PodStatus) => {
    const { activeNamespaceName, dispatch, canEdit } = this.props;

    return (
      <>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          size="small"
          tooltipTitle="Log"
          to={`/applications/${activeNamespaceName}/logs?` + getPodLogQuery(activeNamespaceName, pod)}
        >
          <KalmLogIcon />
        </IconLinkWithToolTip>
        {canEdit ? (
          <IconLinkWithToolTip
            onClick={() => {
              blinkTopProgressAction();
            }}
            tooltipTitle="Shell"
            size="small"
            to={`/applications/${activeNamespaceName}/shells?` + getPodLogQuery(activeNamespaceName, pod)}
          >
            <KalmConsoleIcon />
          </IconLinkWithToolTip>
        ) : null}
        {canEdit ? (
          <DeleteButtonWithConfirmPopover
            iconSize="small"
            popupId="delete-pod-popup"
            popupTitle="DELETE POD?"
            confirmedAction={async () => {
              blinkTopProgressAction();

              try {
                await api.deletePod(activeNamespaceName, pod.name);
                dispatch(setSuccessNotificationAction(`Delete pod ${pod.name} successfully`));
                // reload
                dispatch(loadComponentsAction(activeNamespaceName));
                dispatch(loadApplicationAction(activeNamespaceName));
              } catch (e) {
                dispatch(setErrorNotificationAction(e.response.data.message));
              }
            }}
          />
        ) : null}
      </>
    );
  };

  private renderPodStatus = (pod: PodStatus) => {
    if (pod.isTerminating) {
      return <PendingBadge />;
    }

    switch (pod.status) {
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

  private renderPodStatusIcon = (pod: PodStatus) => {
    if (pod.status === "Failed") {
      const popoverBody = (
        <Box p={2} maxWidth={800}>
          {pod.warnings.map((w, index) => {
            return (
              <Box color="error.main" key={index}>
                {index + 1}. {w.message}
              </Box>
            );
          })}
        </Box>
      );

      return (
        <IconWithPopover
          icon={this.renderPodStatus(pod)}
          popoverBody={popoverBody}
          popupId={`pod-${pod.name}-popover`}
        />
      );
    }

    return this.renderPodStatus(pod);
  };

  private getKRTableColumns() {
    return [
      // {
      //   // Build our expander column
      //   id: "expander", // Make sure it has an ID
      //   accessor: "expander",
      //   Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded }: any) => (
      //     <span {...getToggleAllRowsExpandedProps()}>{isAllRowsExpanded ? "👇" : "👉"}</span>
      //   ),
      //   Cell: ({ row }: any) => {
      //     console.log("row", row);
      //     // Use the row.canExpand and row.getToggleRowExpandedProps prop getter
      //     // to build the toggle for expanding a row
      //     return row.canExpand ? (
      //       <span
      //         {...row.getToggleRowExpandedProps({
      //           style: {
      //             // We can even use the row.depth property
      //             // and paddingLeft to indicate the depth
      //             // of the row
      //             paddingLeft: `${row.depth * 2}rem`,
      //           },
      //         })}
      //       >
      //         {row.isExpanded ? "👇" : "👉"}
      //       </span>
      //     ) : (
      //       <div>{row.expandContent || "test-col"}</div>
      //     );
      //   },
      // },
      { Header: "", accessor: "statusIcon" },
      { Header: "Pod Name", accessor: "name" },
      { Header: "Node", accessor: "node" },
      { Header: "Restarts", accessor: "restarts" },
      { Header: "Status", accessor: "status" },
      { Header: "Age", accessor: "age" },
      { Header: "CPU", accessor: "cpu" },
      { Header: "Memory", accessor: "memory" },
      { Header: "Actions", accessor: "actions" },
    ];
  }

  private getKRTableData() {
    const { pods } = this.props;
    const data: any[] = [];

    pods?.forEach((pod, index) => {
      const rowData = pod as PodStatus;
      data.push({
        statusIcon: this.renderPodStatusIcon(rowData),
        name: this.renderPodName(rowData),
        node: this.renderPodNode(rowData),
        restarts: this.renderPodRestarts(rowData),
        status: this.renderPodStatusText(rowData),
        age: this.renderPodAGE(rowData),
        cpu: this.renderPodCPU(rowData),
        memory: this.renderPodMemory(rowData),
        actions: this.renderPodActions(rowData),
        // subRows: [
        //   {
        //     expandContent: <div style={{ width: "100%", height: "10px", background: "red" }}>dfsfdsf</div>,
        //   },
        // ],
      });
    });

    return data;
  }

  private renderKRTable() {
    return <KRTable columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
  }

  public render() {
    return <>{this.renderKRTable()}</>;
  }
}

export const PodsTable = withStyles(styles)(connect(mapStateToProps)(PodsTableRaw));
