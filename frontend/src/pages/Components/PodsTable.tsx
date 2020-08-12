import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { loadApplicationAction } from "actions/application";
import { loadComponentsAction } from "actions/component";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { api } from "api";
import Immutable from "immutable";
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
  pods: Immutable.List<PodStatus>;
}

interface State {}

interface RowData extends PodStatus {
  index: number;
}

class PodsTableRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private getData = () => {
    const data: RowData[] = [];

    this.props.pods.forEach((pod, index) => {
      const rowData = pod as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  private renderPodName = (pod: RowData) => {
    return pod.get("name");
  };

  private renderPodNode = (pod: RowData) => {
    return pod.get("node");
  };

  private renderPodRestarts = (pod: RowData) => {
    return pod.get("restarts");
  };

  private renderPodStatusText = (pod: RowData) => {
    return pod.get("statusText");
  };

  private renderPodAGE = (pod: RowData) => {
    return formatTimeDistance(pod.get("createTimestamp"));
  };

  private renderPodCPU = (pod: RowData) => {
    return <SmallCPULineChart data={pod.get("metrics").get("cpu")!} />;
  };

  private renderPodMemory = (pod: RowData) => {
    return <SmallMemoryLineChart data={pod.get("metrics").get("memory")!} />;
  };

  private renderPodActions = (pod: RowData) => {
    const { activeNamespaceName, dispatch } = this.props;
    const hasWriterRole = true;

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
        {hasWriterRole ? (
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
        {hasWriterRole ? (
          <DeleteButtonWithConfirmPopover
            iconSize="small"
            popupId="delete-pod-popup"
            popupTitle="DELETE POD?"
            confirmedAction={async () => {
              blinkTopProgressAction();

              try {
                await api.deletePod(activeNamespaceName, pod.get("name"));
                dispatch(setSuccessNotificationAction(`Delete pod ${pod.get("name")} successfully`));
                // reload
                dispatch(loadComponentsAction(activeNamespaceName));
                dispatch(loadApplicationAction(activeNamespaceName));
              } catch (e) {
                dispatch(setErrorNotificationAction(e.response.data.message));
              }
            }}
          />
        ) : // <IconButtonWithTooltip
        //   tooltipTitle="Delete"
        //   size="small"
        //   onClick={async () => {
        //     blinkTopProgressAction();

        //     try {
        //       await api.deletePod(activeNamespaceName, pod.get("name"));
        //       dispatch(setSuccessNotificationAction(`Delete pod ${pod.get("name")} successfully`));
        //       // reload
        //       dispatch(loadComponentsAction(activeNamespaceName));
        //       dispatch(loadApplicationAction(activeNamespaceName));
        //     } catch (e) {
        //       dispatch(setErrorNotificationAction(e.response.data.message));
        //     }
        //   }}
        // >
        //   <DeleteIcon />
        // </IconButtonWithTooltip>
        null}
      </>
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

  private renderPodStatusIcon = (pod: RowData) => {
    if (pod.get("status") === "Failed") {
      const popoverBody = (
        <Box p={2} maxWidth={800}>
          {pod
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

      return (
        <IconWithPopover
          icon={this.renderPodStatus(pod)}
          popoverBody={popoverBody}
          popupId={`pod-${pod.get("name")}-popover`}
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

    pods &&
      pods.forEach((pod, index) => {
        const rowData = pod as RowData;
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
