import React from "react";
import { Box, createStyles, Theme, Typography, withStyles, WithStyles } from "@material-ui/core";
import { Doughnut } from "react-chartjs-2";
import { CenterCaption } from "./Label";
import { green, grey, red } from "@material-ui/core/colors";
import * as chartjs from "chart.js";

const size = 96;
const colors = [green[700], grey[700], red[700]];

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    pieChartWrapper: {
      flex: 1,
      display: "flex",
      alignItems: "center",
    },
    text: {
      display: "flex",
      justifyContent: "center",
    },
  });

interface Props extends WithStyles<typeof styles> {
  title: string;
  labels: string[];
  data: number[];
  insideLabel?: boolean;
}

interface State {}

class DoughnutChartRaw extends React.PureComponent<Props, State> {
  private getData = (): chartjs.ChartData => {
    const { labels, data } = this.props;
    return {
      labels,
      datasets: [
        {
          data,
          borderWidth: 2,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
        },
      ],
    };
  };

  public render() {
    const { classes, labels, data, title } = this.props;
    const chartData: chartjs.ChartData = this.getData();
    return (
      <div className={classes.root} style={{ width: size }}>
        {title && <CenterCaption>{title}</CenterCaption>}
        <div className={classes.pieChartWrapper}>
          <Doughnut
            height={size}
            width={size}
            data={chartData}
            legend={{ position: "bottom" }}
            options={{
              maintainAspectRatio: false,
              cutoutPercentage: 70,
              legend: {
                display: false,
              },
            }}
          />
        </div>
        <Box mt={1}>
          {labels.map((label, index) => {
            if (data[index] === 0) {
              return null;
            } else {
              return (
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box style={{ backgroundColor: colors[index] }} width={10} height={10} mr={1}></Box>
                  <Typography variant="body2">
                    {label}({data[index]})
                  </Typography>
                </Box>
              );
            }
          })}
        </Box>
      </div>
    );
  }
}

export const DoughnutChart = withStyles(styles)(DoughnutChartRaw);
