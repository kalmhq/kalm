import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { loadApplicationAction } from "actions/application";
import { loadComponentsAction } from "actions/component";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { api } from "api";
import Immutable from "immutable";
import { MaterialTableProps } from "material-table";
import { getPodLogQuery } from "pages/Application/Log";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { PodStatus } from "types/application";
import { WorkloadType, workloadTypeCronjob } from "types/componentTemplate";
import { formatTimeDistance } from "utils/date";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { KalmConsoleIcon, KalmLogIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { KTable } from "widgets/Table";
import { isCronjobCompleted } from "utils/application";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";

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

interface PodRowData extends PodStatus {
  index: number;
}

class PodsTableRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private getData = () => {
    const data: PodRowData[] = [];

    this.props.pods.forEach((pod, index) => {
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
    const { workloadType } = this.props;
    if (workloadType === workloadTypeCronjob && isCronjobCompleted(pod)) {
      return <SuccessBadge />;
    }

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
      { title: "Pod Name", sorting: false, render: this.renderPodName },
      { title: "Node", sorting: false, render: this.renderPodNode },
      { title: "Restarts", sorting: false, render: this.renderPodRestarts },
      { title: "Status", sorting: false, render: this.renderPodStatusText },
      { title: "Age", sorting: false, render: this.renderPodAGE },
      { title: "CPU", sorting: false, render: this.renderPodCPU },
      { title: "Memory", sorting: false, render: this.renderPodMemory },
      { title: "", sorting: false, render: this.renderPodActions, cellStyle: { minWidth: 122 } },
    ];
  };

  public render() {
    const { pods } = this.props;
    return (
      <KTable
        options={{ padding: "dense", paging: pods.size > 20 }}
        columns={this.getColumns()}
        data={this.getData()}
        detailPanel={this.renderPodWarnings}
      />
    );
  }
}

export const PodsTable = withStyles(styles)(connect(mapStateToProps)(PodsTableRaw));
