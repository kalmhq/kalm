import { Box, createStyles, Theme, withStyles, WithStyles, withTheme, WithTheme } from "@material-ui/core";
import { Flowpoint, Flowspace } from "flowpoints";
import Immutable from "immutable";
import React from "react";
import { HttpRouteDestination } from "types/route";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithTheme {
  activeNamespaceName: string;
  destinations: Immutable.List<HttpRouteDestination>;
}

class TargetsRaw extends React.PureComponent<Props> {
  public render() {
    const { activeNamespaceName, destinations, theme } = this.props;
    let sum = 0;
    destinations.forEach((x) => (sum += x.get("weight")));
    const size = destinations.size;
    const leftPoinitHeight = 12;
    const pointHeight = 32;
    const pointMargin = 10;
    const spaceHeight = size * (pointHeight + pointMargin) - pointMargin;
    const paddingTop = size > 1 ? "0" : "8px";

    const outputs: any = {};
    destinations.forEach((x, index) => {
      outputs[`point_${index}`] = {
        output: "right",
        input: "left",
        width: 3,
        outputColor: theme.palette.type === "light" ? "#3949ab" : theme.palette.primary.dark,
        inputColor: theme.palette.type === "light" ? "#AACAF1" : theme.palette.primary.light,
      };
    });

    return (
      <Flowspace
        background="rgba(0,0,0,0)"
        style={{
          width: 300,
          height: spaceHeight,
          overflow: "hidden",
          backgroundColor: "rgba(0,0,0,0)",
        }}
        arrowEnd={true}
      >
        <Flowpoint
          variant="filled"
          style={{
            backgroundColor: theme.palette.type === "light" ? "#3949ab" : theme.palette.primary.dark,
            border: "1px #3949ab",
          }}
          startPosition={{ x: 0, y: spaceHeight / 2 - leftPoinitHeight / 2 }}
          dragX={false}
          dragY={false}
          key="point_a"
          outputs={outputs}
          width={12}
          height={leftPoinitHeight}
        />

        {destinations.map((x, index) => {
          return (
            <Flowpoint
              variant="filled"
              style={{
                backgroundColor: theme.palette.type === "light" ? "#AACAF1" : theme.palette.primary.light,
                border: "1px #AACAF1",
                fontSize: "12px",
                color: "#000",
                textAlign: "center",
                width: "auto",
                minWidth: "112px",
                paddingLeft: "8px",
                paddingRight: "8px",
                paddingTop: paddingTop,
              }}
              key={`point_${index}`}
              height={pointHeight}
              startPosition={{ x: 80, y: index * (pointHeight + pointMargin) }}
              dragX={false}
              dragY={false}
            >
              <Box>
                {x
                  .get("host")
                  .replace(`.${activeNamespaceName}.svc.cluster.local`, "")
                  .replace(`.svc.cluster.local`, "")}
              </Box>
              {size > 1 && <Box>{Math.floor((x.get("weight") / sum) * 1000 + 0.5) / 10}%</Box>}
            </Flowpoint>
          );
        })}
      </Flowspace>
    );
  }
}

export const Targets = withStyles(styles)(withTheme(TargetsRaw));
