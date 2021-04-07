import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { loadComponentsAction } from "actions/component";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { api } from "api";
import { getPodLogQuery } from "pages/Application/Log";
import { PodCPUChart, PodMemoryChart } from "pages/Components/Chart";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import { TDispatchProp } from "types";
import { ApplicationComponentDetails, PodStatus } from "types/application";
import { WorkloadType } from "types/componentTemplate";
import { formatAgeFromNow } from "utils/date";
import { ErrorBadge, PendingBadge, SuccessBadge } from "widgets/Badge";
import { KalmConsoleIcon, KalmLogIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover, IconWithPopover } from "widgets/IconWithPopover";
import { KRTable } from "widgets/KRTable";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  activeNamespaceName: string;
  component: ApplicationComponentDetails;
  workloadType: WorkloadType;
  pods: PodStatus[];
  canEdit?: boolean;
}

const PodsTableRaw: React.FC<Props> = (props) => {
  const renderPodName = (pod: PodStatus) => {
    return pod.name;
  };

  const renderPodRestarts = (pod: PodStatus) => {
    return pod.restarts;
  };

  const renderPodStatusText = (pod: PodStatus) => {
    return pod.statusText;
  };

  const renderPodAGE = (pod: PodStatus) => {
    return formatAgeFromNow(pod.createTimestamp);
  };

  const renderPodCPU = (pod: PodStatus) => {
    // return <SmallCPULineChart data={pod.metrics.cpu!} />;
    return <PodCPUChart pod={pod} component={props.component} />;
  };

  const renderPodMemory = (pod: PodStatus) => {
    return <PodMemoryChart pod={pod} component={props.component} />;
    // return <SmallMemoryLineChart data={pod.metrics.memory!} />;
  };

  const renderPodActions = (pod: PodStatus) => {
    const { activeNamespaceName, dispatch, canEdit } = props;

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
        {canEdit && pod.status === "Running" ? (
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
              } catch (e) {
                dispatch(setErrorNotificationAction(e.response.data.message));
              }
            }}
          />
        ) : null}
      </>
    );
  };

  const renderPodStatus = (pod: PodStatus) => {
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

  const renderPodStatusIcon = (pod: PodStatus) => {
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
        <IconWithPopover icon={renderPodStatus(pod)} popoverBody={popoverBody} popupId={`pod-${pod.name}-popover`} />
      );
    }

    return renderPodStatus(pod);
  };

  const getKRTableColumns = () => {
    return [
      { Header: "", accessor: "statusIcon" },
      { Header: "Pod Name", accessor: "name" },
      // { Header: "Node", accessor: "node" },
      { Header: "Restarts", accessor: "restarts" },
      { Header: "Status", accessor: "status" },
      { Header: "Age", accessor: "age" },
      { Header: "CPU", accessor: "cpu" },
      { Header: "Memory", accessor: "memory" },
      { Header: "Actions", accessor: "actions" },
    ];
  };

  const getKRTableData = () => {
    const { pods } = props;
    const data: any[] = [];

    pods?.forEach((pod, index) => {
      data.push({
        statusIcon: renderPodStatusIcon(pod),
        name: renderPodName(pod),
        // node: renderPodNode(pod),
        restarts: renderPodRestarts(pod),
        status: renderPodStatusText(pod),
        age: renderPodAGE(pod),
        cpu: renderPodCPU(pod),
        memory: renderPodMemory(pod),
        actions: renderPodActions(pod),
      });
    });

    return data;
  };

  const renderKRTable = () => {
    return <KRTable noOutline columns={getKRTableColumns()} data={getKRTableData()} />;
  };

  return <>{renderKRTable()}</>;
};

export const PodsTable = withStyles(styles)(connect(mapStateToProps)(PodsTableRaw));
