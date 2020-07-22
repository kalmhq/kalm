import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    bar: {
      height: 22,
      backgroundColor: indigo[100],
    },
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Option {
  name: string;
  value: number;
  unit: string;
}

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  allocateds: Option[];
}

interface State {}

class ResourceRankRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { classes, allocateds } = this.props;

    const maxBarWidth = 200;
    let maxValue = 0;
    allocateds.forEach((a) => {
      if (a.value > maxValue) {
        maxValue = a.value;
      }
    });

    return (
      <Box p={2}>
        <Box pb={2}>Applications (TODO: fake data now)</Box>
        {allocateds.map((a) => {
          return (
            <Box display="flex" pb={1}>
              <Box width={maxBarWidth} mr={1}>
                <Box width={(a.value / maxValue) * maxBarWidth} className={classes.bar} pl={1}>
                  {a.name}
                </Box>
              </Box>
              <Box width="50px" textAlign="right">
                {a.value + " " + a.unit}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  }
}

export const ResourceRank = withStyles(styles)(connect(mapStateToProps)(ResourceRankRaw));
