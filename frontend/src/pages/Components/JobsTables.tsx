import { loadComponentsAction } from "actions/component";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { api } from "api";
import React from "react";
import { useDispatch } from "react-redux";
import { ApplicationComponentDetails, JobStatus } from "types/application";
import { WorkloadType } from "types/componentTemplate";
import { formatAgeFromNow, formatTimeDistance } from "utils/date";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { KRTable } from "widgets/KRTable";

interface Props {
  activeNamespaceName: string;
  component: ApplicationComponentDetails;
  workloadType: WorkloadType;
  jobs: JobStatus[];
  canEdit?: boolean;
}

export const JobsTable: React.FC<Props> = (props) => {
  const dispatch = useDispatch();
  const { jobs, activeNamespaceName, canEdit } = props;

  const renderJobName = (job: JobStatus) => {
    return job.name;
  };

  const renderJobAGE = (job: JobStatus) => {
    return formatAgeFromNow(job.createTimestamp);
  };

  const renderJobActions = (job: JobStatus) => {
    return (
      <>
        {canEdit ? (
          <DeleteButtonWithConfirmPopover
            iconSize="small"
            popupId="delete-job-popup"
            popupTitle="DELETE JOB?"
            confirmedAction={async () => {
              blinkTopProgressAction();

              try {
                await api.deleteJob(activeNamespaceName, job.name);
                dispatch(setSuccessNotificationAction(`Delete job ${job.name} successfully`));
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

  const renderCompletions = (job: JobStatus): string => {
    return job.succeeded + "/" + job.completions;
  };

  const renderDuration = (job: JobStatus): string => {
    if (job.completions === job.succeeded) {
      return formatTimeDistance(job.completionTimestamp - job.startTimestamp);
    } else {
      return "-";
    }
  };

  const getKRTableColumns = () => {
    return [
      //   { Header: "", accessor: "statusIcon" },
      { Header: "Job Name", accessor: "name" },
      { Header: "Completions", accessor: "completions" },
      { Header: "Duration", accessor: "duration" },
      { Header: "Age", accessor: "age" },
      { Header: "Actions", accessor: "actions" },
    ];
  };

  const getKRTableData = () => {
    const data: any[] = [];

    jobs?.forEach((job) => {
      data.push({
        // statusIcon: renderJobStatusIcon(job),
        name: renderJobName(job),
        completions: renderCompletions(job),
        duration: renderDuration(job),
        age: renderJobAGE(job),
        actions: renderJobActions(job),
      });
    });

    return data;
  };

  return <KRTable noOutline columns={getKRTableColumns()} data={getKRTableData()} />;
};
