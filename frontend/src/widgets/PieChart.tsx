import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { Pie } from "react-chartjs-2";
import { CenterCaption } from "./Label";
import { green, grey, red } from "@material-ui/core/colors";
import "chartjs-plugin-labels";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      // height: "100%",
      // width: "100%",
      // display: "flex",
      // flexDirection: "column"
    },
    pieChartWrapper: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      // padding: 20
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

class PieChartRaw extends React.PureComponent<Props, State> {
  private getData() {
    const { labels, data } = this.props;
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [green[700], grey[700], red[700]],
          hoverBackgroundColor: [green[700], grey[700], red[700]],
        },
      ],
    };
  }

  public render() {
    const { classes, title, insideLabel } = this.props;
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
                  position: insideLabel ? "inside" : "outside",
                  fontColor: insideLabel ? "#FFFFFF" : "#7E7E7E",
                  // arc: true
                },
              },
            }}
          />
        </div>
        {title && <CenterCaption>{title}</CenterCaption>}
      </div>
    );
  }
}

export const PieChartComponent = withStyles(styles)(PieChartRaw);
