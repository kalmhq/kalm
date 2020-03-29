import React from "react";
import { Line, ChartData } from "react-chartjs-2";
import * as chartjs from "chart.js";
import { withStyles, createStyles, WithStyles } from "@material-ui/styles";
import { Theme } from "@material-ui/core";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      border: "1px solid #DDD",
      position: "relative"
    },
    text: {
      position: "absolute",
      top: "50%",
      transform: "translate(-50%, -50%)",
      left: "50%"
    }
  });

interface Props extends WithStyles<typeof styles> {
  data: { x: number; y: number }[];
  formatValue?: (value: number) => string;
}

class SmallLineChartRaw extends React.PureComponent<Props> {
  private generateData = (): ChartData<chartjs.ChartData> => {
    const { data } = this.props;

    return {
      labels: data.map(n => n.x),
      datasets: [
        {
          //   fill: false,
          lineTension: 0.1,
          borderColor: "#DDD",
          borderWidth: 1,
          backgroundColor: "rgba(75,192,192,0.4)",
          //   borderColor: "rgba(75,192,192,1)",
          //   borderCapStyle: "butt",
          //   borderDash: [],
          //   borderDashOffset: 0.0,
          //   borderJoinStyle: "miter",
          //   pointBorderColor: "rgba(75,192,192,1)",
          //   pointBackgroundColor: "#fff",
          //   pointBorderWidth: 1,
          pointHoverRadius: 0,
          //   pointHoverBackgroundColor: "rgba(75,192,192,1)",
          //   pointHoverBorderColor: "rgba(220,220,220,1)",
          //   pointHoverBorderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 0,
          data: data.map(n => n.y)
        }
      ]
    };
  };

  private renderText() {
    const { data, formatValue } = this.props;
    let text = "No Data";

    if (data.length > 0) {
      if (formatValue) {
        text = formatValue(data[data.length - 1].y);
      } else {
        text = data[data.length - 1].y.toString();
      }
    }

    return <div className={this.props.classes.text}>{text}</div>;
  }

  public render() {
    const { classes } = this.props;
    return (
      <div style={{ width: 120, height: 40 }} className={classes.root}>
        {this.renderText()}
        <Line
          //   width={160}
          //   height={50}
          legend={{ display: false }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            tooltips: {
              enabled: false
            },
            scales: {
              yAxes: [
                {
                  display: false,
                  gridLines: {
                    display: false
                  },
                  ticks: {
                    beginAtZero: true
                  }
                }
              ],
              xAxes: [
                {
                  display: false,
                  gridLines: {
                    display: false
                  }
                }
              ]
            }
          }}
          data={this.generateData()}
        />
      </div>
    );
  }
}

export const SmallLineChart = withStyles(styles)(SmallLineChartRaw);

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

export const SmallMemoryLineChart = (props: Omit<Props, "formatValue" | "classes">) => {
  return <SmallLineChart {...props} formatValue={formatMemory} />;
};

export const SmallCPULineChart = (props: Omit<Props, "formatValue" | "classes">) => {
  return <SmallLineChart {...props} formatValue={formatCPU} />;
};
