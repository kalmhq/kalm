import { Box, Grid, Link, Typography } from "@material-ui/core";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withRoutesData, WithRoutesDataProps } from "hoc/withRoutesData";
import React, { ReactElement, useState } from "react";
import { TimestampFilter } from "utils/date";
import { HttpBytesSizeChart } from "widgets/charts/httpBytesSizeChart";
import { HttpStatusCodeLineChart } from "widgets/charts/httpStatusCodeChart";
import { DoughnutChart } from "widgets/DoughnutChart";
import { Expansion } from "widgets/expansion";
import { KRTable } from "widgets/KRTable";
import { BigCPULineChart, BigMemoryLineChart } from "widgets/SmallLineChart";

interface Props extends WithNamespaceProps, WithRoutesDataProps {}

const DetailsRaw: React.FC<Props> = (props) => {
  const [chartDateFilter] = useState("all");

  // const renderPodStatus = (pod: PodStatus) => {
  //   if (pod.isTerminating) {
  //     return <PendingBadge />;
  //   }

  //   switch (pod.status) {
  //     case "Running": {
  //       return <SuccessBadge />;
  //     }
  //     case "Pending": {
  //       return <PendingBadge />;
  //     }
  //     case "Succeeded": {
  //       return <SuccessBadge />;
  //     }
  //     case "Failed": {
  //       return <ErrorBadge />;
  //     }
  //   }
  // };

  // const renderComponentStatus = (component: ApplicationComponentDetails) => {
  //   let isError = false;
  //   let isPending = false;

  //   component.pods?.forEach((pod) => {
  //     if (pod.isTerminating) {
  //       isPending = true;
  //     } else {
  //       switch (pod.status) {
  //         case "Pending": {
  //           isPending = true;
  //           break;
  //         }
  //         case "Failed": {
  //           isError = true;
  //           break;
  //         }
  //       }
  //     }
  //   });

  //   if (isError) {
  //     return <ErrorBadge />;
  //   } else if (isPending) {
  //     return <PendingBadge />;
  //   } else {
  //     return <SuccessBadge />;
  //   }
  // };

  const getPieChartData = () => {
    const { components } = props;

    let componentSuccess = 0;
    let componentPending = 0;
    let componentError = 0;
    let podSuccess = 0;
    let podPending = 0;
    let podError = 0;

    components?.forEach((component) => {
      let hasError = false;
      let hasPending = false;
      component.pods?.forEach((pod) => {
        if (pod.status === "Succeeded" || pod.status === "Running") {
          podSuccess = podSuccess + 1;
        } else if (pod.status === "Failed") {
          podError = podError + 1;
          hasError = true;
        } else {
          podPending = podPending + 1;
          hasPending = true;
        }
      });

      if (hasError) {
        componentError = componentError + 1;
      } else if (hasPending) {
        componentPending = componentPending + 1;
      } else {
        componentSuccess = componentSuccess + 1;
      }
    });

    return {
      componentSuccess,
      componentPending,
      componentError,
      podSuccess,
      podPending,
      podError,
    };
  };

  const getWarningsKRTableColumns = () => {
    return [
      { accessor: "componentName", Header: "Component" },
      { accessor: "podName", Header: "Pod" },
      {
        accessor: "message",
        Header: "Message",
      },
    ];
  };

  const getWarningsKRTableData = () => {
    const { components, activeNamespace } = props;
    let warnings: { componentName: ReactElement; podName: ReactElement; message: ReactElement }[] = [];

    if (components) {
      components.forEach((c) => {
        c.pods?.forEach((p) => {
          p.warnings.forEach((w) => {
            warnings.push({
              componentName: <Link href={`/namespaces/${activeNamespace?.name}/components/${c.name}`}>{c.name}</Link>,
              podName: <Link href={`/namespaces/${activeNamespace?.name}/components/${c.name}`}>{p.name}</Link>,
              message: <Typography color="error">{w.message}</Typography>,
            });
          });
        });
      });
    }

    return warnings;
  };

  const renderWarningsKRTable = () => {
    return (
      <KRTable showTitle={false} noOutline columns={getWarningsKRTableColumns()} data={getWarningsKRTableData()} />
    );
  };

  const formatYAxesValue = (value: number, label: string) => {
    return value.toFixed(2);
    // return `${label}: ${value.toFixed(2)}`;
  };

  const pieChartData = getPieChartData();
  const { activeNamespace } = props;

  return (
    <>
      <Expansion title="Workload" defaultUnfold>
        <Box display="flex" justifyContent={"space-around"} p={2}>
          <DoughnutChart
            title="Components"
            labels={["Running", "Pending", "Error"]}
            data={[pieChartData.componentSuccess, pieChartData.componentPending, pieChartData.componentError]}
          />
          <DoughnutChart
            title="Pods"
            labels={["Running", "Pending", "Error"]}
            data={[pieChartData.podSuccess, pieChartData.podPending, pieChartData.podError]}
          />
          <DoughnutChart title="Routes" labels={["Running"]} data={[props.httpRoutes.length]} />
        </Box>
      </Expansion>
      <Expansion title="Metrics" defaultUnfold>
        <Grid container spacing={2}>
          <Grid item xs>
            <HttpStatusCodeLineChart
              formatYAxesValue={formatYAxesValue}
              data={[
                {
                  legend: "2xx",
                  data: activeNamespace!.istioMetricHistories?.httpRespCode2XXCount || [],
                },
                {
                  legend: "4xx",
                  data: activeNamespace!.istioMetricHistories?.httpRespCode4XXCount || [],
                },
                {
                  legend: "5xx",
                  data: activeNamespace!.istioMetricHistories?.httpRespCode5XXCount || [],
                },
              ]}
              title="http response code per second"
              filter={chartDateFilter as TimestampFilter}
            />
          </Grid>
          <Grid item xs>
            <HttpBytesSizeChart
              formatYAxesValue={formatYAxesValue}
              data={[
                {
                  legend: "request",
                  data: activeNamespace!.istioMetricHistories?.httpRequestBytes || [],
                },
                {
                  legend: "response",
                  data: activeNamespace!.istioMetricHistories?.httpResponseBytes || [],
                },
              ]}
              title="http traffic"
              filter={chartDateFilter as TimestampFilter}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item md>
            <BigCPULineChart
              data={activeNamespace!.metrics?.cpu}
              yAxesWidth={50}
              filter={chartDateFilter as TimestampFilter}
            />
          </Grid>
          <Grid item md>
            <BigMemoryLineChart
              data={activeNamespace!.metrics?.memory}
              yAxesWidth={50}
              filter={chartDateFilter as TimestampFilter}
            />
          </Grid>
        </Grid>
      </Expansion>

      <Expansion title="Warnings" defaultUnfold>
        {renderWarningsKRTable()}
      </Expansion>
    </>
  );
};

export const ApplicationOverview = withNamespace(withRoutesData(DetailsRaw));
