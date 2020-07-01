import { Theme } from "@material-ui/core";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import * as chartjs from "chart.js";
import { format } from "date-fns";
import React from "react";
// @ts-ignore
import { Chart, ChartData, Line } from "react-chartjs-2";
import { MetricList } from "../types/common";
import { WhitePaper } from "./Paper";
import { CenterCaption } from "./Label";

Chart.controllers.line = Chart.controllers.line.extend({
  draw: function (ease: any) {
    if (this.chart.tooltip._active && this.chart.tooltip._active.length) {
      var activePoint = this.chart.tooltip._active[0],
        ctx = this.chart.ctx,
        x = activePoint.tooltipPosition().x,
        topY = this.chart.legend.bottom,
        bottomY = this.chart.chartArea.bottom;

      // draw line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(75,192,192,0.4)";
      ctx.stroke();
      ctx.restore();
    }
  },
});

const smallLineChartStyles = (theme: Theme) =>
  createStyles({
    root: {
      border: "1px solid #DDD",
      position: "relative",
      background: "white",
      display: "inline-block",
      verticalAlign: "middle",
    },
    text: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      position: "absolute",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
    },
  });

interface Props extends WithStyles<typeof smallLineChartStyles> {
  data: MetricList;
  width: number | string;
  height: number | string;
  formatValue?: (value: number) => string;
  borderColor?: string;
  backgroundColor?: string;
}

class SmallLineChartRaw extends React.PureComponent<Props> {
  private generateData = (): ChartData<chartjs.ChartData> => {
    const { data, borderColor, backgroundColor } = this.props;

    return {
      labels: data.map((n) => n.get("x")).toArray(),
      datasets: [
        {
          lineTension: 0.1,
          borderColor: borderColor || "#DDD",
          borderWidth: 1,
          backgroundColor: backgroundColor || "rgba(75,192,192,0.4)",
          pointHoverRadius: 0,
          pointRadius: 0,
          pointHitRadius: 0,
          data: data.map((n) => n.get("y")).toArray(),
        },
      ],
    };
  };

  private renderText() {
    const { data, formatValue } = this.props;
    let text = "No Data";

    if (data && data.size > 0) {
      if (formatValue) {
        text = formatValue(data.get(data.size - 1)!.get("y"));
      } else {
        text = data
          .get(data.size - 1)!
          .get("y")
          .toString();
      }
    }

    return <div className={this.props.classes.text}>{text}</div>;
  }

  private hasData = () => {
    const { data } = this.props;
    return data && data.size > 0;
  };

  public render() {
    const { classes, width, height } = this.props;
    const hasData = this.hasData();
    return (
      <div style={{ width, height }} className={classes.root}>
        {this.renderText()}
        {hasData ? (
          <Line
            legend={{ display: false }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              tooltips: {
                enabled: false,
              },
              scales: {
                yAxes: [
                  {
                    display: false,
                    gridLines: {
                      display: false,
                    },
                    ticks: {
                      beginAtZero: true,
                    },
                  },
                ],
                xAxes: [
                  {
                    display: false,
                    gridLines: {
                      display: false,
                    },
                  },
                ],
              },
            }}
            data={this.generateData()}
          />
        ) : null}
      </div>
    );
  }
}

export const SmallLineChart = withStyles(smallLineChartStyles)(SmallLineChartRaw);

const lineChartStyles = (theme: Theme) =>
  createStyles({
    root: {
      position: "relative",
      background: "white",
      display: "inline-block",
      paddingTop: theme.spacing(2),
    },
    text: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      position: "absolute",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
    },
  });

interface LineChartProps extends WithStyles<typeof lineChartStyles> {
  data: MetricList;
  width: number | string;
  height: number | string;
  formatValue?: (value: number) => string;
  borderColor?: string;
  backgroundColor?: string;
}

class LineChartRaw extends React.PureComponent<LineChartProps> {
  private generateData = (): ChartData<chartjs.ChartData> => {
    const { data, borderColor, backgroundColor } = this.props;

    return {
      labels: data ? data.map((n) => n.get("x")).toArray() : [],
      datasets: [
        {
          //   fill: false,
          lineTension: 0.1,
          borderColor: borderColor || "#DDD",
          borderWidth: 1,
          backgroundColor: backgroundColor || "rgba(75,192,192,0.4)",
          borderCapStyle: "butt",
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: "miter",
          pointBorderColor: "rgba(75,192,192,1)",
          pointBackgroundColor: "#fff",
          pointBorderWidth: 1,
          pointHoverRadius: 2,
          pointHoverBackgroundColor: "rgba(75,192,192,1)",
          pointHoverBorderColor: "rgba(220,220,220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 1,
          data: data ? data.map((n) => n.get("y")).toArray() : [],
        },
      ],
    };
  };

  public render() {
    const { classes, width, height, formatValue } = this.props;
    return (
      <div style={{ width, height }} className={classes.root}>
        <Line
          legend={{ display: false }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 10,
                right: 10,
              },
            },
            tooltips: {
              intersect: false,
              callbacks: {
                label: (tooltipItem: chartjs.ChartTooltipItem, data: chartjs.ChartData): string => {
                  // @ts-ignore
                  const value: number = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                  // @ts-ignore
                  return formatValue ? formatValue(value) : value;
                },
                title: (tooltipItem: chartjs.ChartTooltipItem[], data: chartjs.ChartData): string => {
                  // @ts-ignore
                  return format(tooltipItem[0].xLabel, "yyyy-MM-dd HH:mm");
                },
              },
            },
            scales: {
              yAxes: [
                {
                  ticks: {
                    maxTicksLimit: 5,
                    beginAtZero: true,
                    callback: formatValue,
                  },
                },
              ],
              xAxes: [
                {
                  ticks: {
                    callback: (value) => {
                      return format(value, "HH:mm");
                    },
                  },
                },
              ],
            },
          }}
          data={this.generateData()}
        />
      </div>
    );
  }
}

export const LineChart = withStyles(lineChartStyles)(LineChartRaw);

const formatMemory = (value: number, si?: boolean): string => {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(value) < thresh) {
    return value + " B";
  }
  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  do {
    value /= thresh;
    ++u;
  } while (Math.abs(value) >= thresh && u < units.length - 1);
  return value.toFixed(1) + " " + units[u];
};

const formatCPU = (value: number): string => {
  return value / 1000 + " Core";
};

export const BigCPULineChart = (props: Pick<Props, "data">) => {
  return (
    <WhitePaper elevation={0} style={{ overflow: "hidden" }}>
      <LineChart
        {...props}
        formatValue={formatCPU}
        height={160}
        width={"100%"}
        borderColor="rgba(33, 150, 243, 1)"
        backgroundColor="rgba(33, 150, 243, 0.5)"
      />
      <CenterCaption>CPU</CenterCaption>
    </WhitePaper>
  );
};

export const BigMemoryLineChart = (props: Pick<Props, "data">) => {
  return (
    <WhitePaper elevation={0} style={{ overflow: "hidden" }}>
      <LineChart
        {...props}
        formatValue={formatMemory}
        height={160}
        width={"100%"}
        borderColor="rgba(75,192,192, 1)"
        backgroundColor="rgba(75,192,192,0.5)"
      />
      <CenterCaption>Memory</CenterCaption>
    </WhitePaper>
  );
};

export const SmallMemoryLineChart = (props: Pick<Props, "data">) => {
  return (
    <SmallLineChart
      {...props}
      formatValue={formatMemory}
      width={120}
      height={24}
      borderColor="rgba(75,192,192, 1)"
      backgroundColor="rgba(75,192,192,0.5)"
    />
  );
};

export const SmallCPULineChart = (props: Pick<Props, "data">) => {
  return (
    <SmallLineChart
      {...props}
      formatValue={formatCPU}
      width={120}
      height={24}
      borderColor="rgba(33, 150, 243, 1)"
      backgroundColor="rgba(33, 150, 243, 0.5)"
    />
  );
};
