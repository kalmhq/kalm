import React from "react";
import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { KTable } from "widgets/Table";
import { formatTimeDistance } from "utils";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";
import { IconButtonWithTooltip, IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { blinkTopProgressAction } from "actions/settings";
import { generateQueryForPods } from "pages/Application/Log";
import { KappConsoleIcon, KappLogIcon } from "widgets/Icon";
import { api } from "api";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { loadApplicationAction } from "actions/application";
import DeleteIcon from "@material-ui/icons/Delete";
import { MaterialTableProps } from "material-table";
import { PodStatus } from "types/application";
import Immutable from "immutable";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    // xxx: state.get("xxx").get("xxx"),
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  activeNamespaceName: string;
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
            `/applications/${activeNamespaceName}/logs?` +
            generateQueryForPods(
              activeNamespaceName,
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
              `/applications/${activeNamespaceName}/shells?` +
              generateQueryForPods(
                activeNamespaceName,
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
                await api.deletePod(activeNamespaceName, pod.get("name"));
                dispatch(setSuccessNotificationAction(`Delete pod ${pod.get("name")} successfully`));
                // reload
                dispatch(loadApplicationAction(activeNamespaceName));
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

  public render() {
    const { classes, pods } = this.props;
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
