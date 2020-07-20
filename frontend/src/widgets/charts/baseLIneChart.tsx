import { Theme } from "@material-ui/core";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import { MetricList } from "types/common";
import React from "react";
import { ChartData, Line } from "react-chartjs-2";
import * as chartjs from "chart.js";
import { ChartDataSets } from "chart.js";
import { format } from "date-fns";

const styles = (theme: Theme) => createStyles({});

export interface BaseLineChartProps {
  data: {
    legend: string;
    data: MetricList;
    borderColor?: string;
    backgroundColor?: string;
  }[];
  title: string;
  fill?: boolean;
  formatYAxesValue?: any;
}

class BaseLineChartRaw extends React.PureComponent<BaseLineChartProps & WithStyles<typeof styles>> {
  private generateData = (): ChartData<chartjs.ChartData> => {
    const { data, fill } = this.props;

    const labels = data[0].data.map((item) => format(item.get("x"), "HH:mm")).toArray();

    const datasets = data.map(
      ({ data, legend, borderColor, backgroundColor }): ChartDataSets => {
        return {
          fill,
          label: legend,
          lineTension: 0.1,
          borderColor: borderColor,
          borderWidth: 1,
          backgroundColor: backgroundColor,
          pointRadius: 1,
          data: data.map((n) => n.get("y")).toArray(),
        };
      },
    );

    return {
      labels,
      datasets,
    };
  };

  public render() {
    const { title, formatYAxesValue } = this.props;

    const yAxes: any = {
      ticks: {
        maxTicksLimit: 5,
        beginAtZero: true,
      },
    };

    if (formatYAxesValue) {
      yAxes.ticks.callback = formatYAxesValue;
    }

    return (
      <Line
        height={200}
        options={{
          title: {
            display: true,
            text: title,
          },
          responsive: true,
          maintainAspectRatio: false,
          tooltips: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (tooltipItem: chartjs.ChartTooltipItem, data: chartjs.ChartData): string => {
                // @ts-ignore
                const value: number = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                // @ts-ignore
                const label: string = data.datasets[tooltipItem.datasetIndex].label;
                // @ts-ignore
                return formatYAxesValue ? formatYAxesValue(value, label) : value;
              },
            },
          },
          scales: {
            yAxes: [yAxes],
            xAxes: [
              {
                ticks: {
                  maxTicksLimit: 10,
                },
              },
            ],
          },
        }}
        data={this.generateData()}
      />
    );
  }
}

export const BaseLineChart = withStyles(styles)(BaseLineChartRaw);
