import { Theme } from "@material-ui/core";
import { createStyles, withStyles, WithStyles } from "@material-ui/styles";
import * as chartjs from "chart.js";
import { format } from "date-fns";
import React from "react";
// @ts-ignore
import { ChartData, Line } from "react-chartjs-2";
import { MetricList } from "types/common";
import { WhitePaper } from "./Paper";
import { CenterCaption } from "./Label";
import { grey } from "@material-ui/core/colors";
import { KTooltip } from "forms/Application/KTooltip";

const smallLineChartStyles = (theme: Theme) =>
  createStyles({
    root: {
      position: "relative",
      display: "inline-block",
      verticalAlign: "middle",
      background: "white",
      border: "1px solid #DDD",
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
  hoverText?: string;
  width: number | string;
  height: number | string;
  formatValue?: (value: number) => string;
  borderColor?: string;
  backgroundColor?: string;
}

const emptyChartDataX = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const emptyChartDataY = [1, 3, 1, 5, 2, 7, 2, 5, 8];

class SmallLineChartRaw extends React.PureComponent<Props> {
  private generateData = (): ChartData<chartjs.ChartData> => {
    const { data, borderColor, backgroundColor } = this.props;

    let dataX = emptyChartDataX;
    let dataY = emptyChartDataY;
    let backgroundColorFixed = backgroundColor;
    let borderColorFixed = borderColor;
    if (data && data.size > 0) {
      dataY = data.map((n) => n.get("y")).toArray();
      dataX = data.map((n) => n.get("x")).toArray();
    } else {
      backgroundColorFixed = grey[400];
      borderColorFixed = grey[400];
    }

    return {
      labels: dataX,
      datasets: [
        {
          lineTension: 0.1,
          borderColor: borderColorFixed || "#DDD",
          borderWidth: 1,
          backgroundColor: backgroundColorFixed || "rgba(75,192,192,0.4)",
          pointHoverRadius: 0,
          pointRadius: 0,
          pointHitRadius: 0,
          data: dataY,
        },
      ],
    };
  };

  private renderText() {
    const { data, formatValue } = this.props;
    // let text = "Data available soon";
    let text = "";

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
    const { classes, width, height, hoverText } = this.props;
    const hasData = this.hasData();

    const line = (
      <div style={{ width, height }} className={classes.root}>
        {this.renderText()}
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
            animation: {
              duration: 0,
              animateScale: false,
              animateRotate: false,
            },
          }}
          data={this.generateData()}
        />
      </div>
    );

    if (hasData) {
      return line;
    }

    return <KTooltip title={hoverText || "Data available soon"}>{line}</KTooltip>;
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

export const formatMemory = (value: number, si?: boolean): string => {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(value) < thresh) {
    return value + " B";
  }
  const units = si ? ["k", "M", "G", "T", "P", "E", "Z", "Y"] : ["Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi", "Yi"];
  let u = -1;
  do {
    value /= thresh;
    ++u;
  } while (Math.abs(value) >= thresh && u < units.length - 1);
  return value.toFixed(1) + " " + units[u];
};

export const formatNumerical = (value: number): string => {
  return value.toString();
};

const formatCPU = (value: number): string => {
  return value / 1000 + " Core";
};

export const NumericalLineChart = (props: Pick<Props, "data"> & { title: string }) => {
  const { title } = props;
  return (
    <WhitePaper elevation={0} style={{ overflow: "hidden" }}>
      <LineChart
        {...props}
        formatValue={formatNumerical}
        height={160}
        width={"100%"}
        borderColor="rgba(33, 150, 243, 1)"
        backgroundColor="rgba(33, 150, 243, 0.5)"
      />
      <CenterCaption>{title}</CenterCaption>
    </WhitePaper>
  );
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

export const SmallMemoryLineChart = (props: Pick<Props, "data" | "hoverText">) => {
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

export const SmallCPULineChart = (props: Pick<Props, "data" | "hoverText">) => {
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

export const CardMemoryLineChart = (props: Pick<Props, "data" | "hoverText">) => {
  return (
    <SmallLineChart
      {...props}
      formatValue={formatMemory}
      width={200}
      height={24}
      borderColor="rgba(75,192,192, 1)"
      backgroundColor="rgba(75,192,192,0.5)"
    />
  );
};

export const CardCPULineChart = (props: Pick<Props, "data" | "hoverText">) => {
  return (
    <SmallLineChart
      {...props}
      formatValue={formatCPU}
      width={200}
      height={24}
      borderColor="rgba(33, 150, 243, 1)"
      backgroundColor="rgba(33, 150, 243, 0.5)"
    />
  );
};
