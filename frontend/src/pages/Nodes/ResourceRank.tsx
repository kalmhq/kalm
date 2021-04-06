import { Box, createStyles, Paper, Theme, withStyles, WithStyles } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";
import { RootState } from "configureStore";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { humanFileSize } from "utils/sizeConv";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    barWrapper: {
      position: "relative",
      height: 22,
      width: "100%",
    },
    bar: {
      height: 22,
      backgroundColor: theme.palette.type === "light" ? blue[200] : blue[400],
    },
    barText: {
      height: 22,
      width: "100%",
      position: "absolute",
      left: "0",
      top: "0",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Option {
  name: string;
  value: number;
  unit?: string; // if not pass unit, will use humanFileSize
}

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  title: string;
  allocateds: Option[];
}

interface State {}

class ResourceRankRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { classes, allocateds, title } = this.props;

    const maxBarWidth = 200;
    let maxValue = 0;
    allocateds.forEach((a) => {
      if (a.value > maxValue) {
        maxValue = a.value;
      }
    });

    allocateds.sort(function (a, b) {
      return b.value - a.value;
    });

    return (
      <Box p={2}>
        <Box pb={2}>{title}</Box>
        {allocateds.map((a, index) => {
          return (
            <Box display="flex" pb={1} key={index}>
              <Box width={maxBarWidth} mr={0.5}>
                <Paper variant="elevation">
                  <Box className={classes.barWrapper}>
                    <Box width={(a.value / maxValue) * maxBarWidth} className={classes.bar}></Box>
                    <Box pl={1} pr={1} className={classes.barText}>
                      {a.name}
                    </Box>
                  </Box>
                </Paper>
              </Box>
              <Box minWidth="70px" textAlign="right">
                {a.unit ? a.value + " " + a.unit : humanFileSize(a.value)}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  }
}

export const ResourceRank = withStyles(styles)(connect(mapStateToProps)(ResourceRankRaw));
