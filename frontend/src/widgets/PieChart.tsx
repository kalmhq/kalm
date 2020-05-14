import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { Pie } from "react-chartjs-2";
import { CenterCaption } from "./Label";
import { green, red, grey } from "@material-ui/core/colors";
import "chartjs-plugin-labels";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "8px"
    },
    pieChartWrapper: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      padding: 20
    },
    text: {
      display: "flex",
      justifyContent: "center"
    }
  });

interface Props extends WithStyles<typeof styles> {
  title: string;
  labels: string[];
  data: number[];
}

interface State {}

class PieChartRaw extends React.PureComponent<Props, State> {
  private getData() {
    const { labels, data } = this.props;
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [green[700], grey[700], red[700]],
          hoverBackgroundColor: [green[700], grey[700], red[700]]
        }
      ]
    };
  }

  public render() {
    const { classes, title } = this.props;
    return (
      <div className={classes.root}>
        <div className={classes.pieChartWrapper}>
          <Pie
            height={100}
            width={100}
            data={this.getData()}
            legend={{ display: false }}
            options={{
              plugins: {
                labels: {
                  render: "value",
                  position: "outside"
                }
              }
            }}
          />
        </div>
        <CenterCaption>{title}</CenterCaption>
      </div>
    );
  }
}

export const PieChart = withStyles(styles)(PieChartRaw);
