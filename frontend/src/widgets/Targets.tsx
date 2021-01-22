import { Box, createStyles, Theme, withStyles, WithStyles, withTheme, WithTheme } from "@material-ui/core";
import { Flowpoint, Flowspace } from "flowpoints";
import React from "react";
import { HttpRouteDestination, HttpRouteDestinationStatus } from "types/route";
import { ErrorIcon } from "./Icon";
import { KTooltip } from "./KTooltip";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

interface Props extends WithStyles<typeof styles>, WithTheme {
  destinations: HttpRouteDestination[];
  destinationsStatus?: HttpRouteDestinationStatus[];
}

class TargetsRaw extends React.PureComponent<Props> {
  public render() {
    const { destinations, destinationsStatus, theme } = this.props;
    let sum = 0;
    destinations.forEach((x) => (sum += x.weight));
    const size = destinations.length;
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
          width: 400,
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
          onClick={() => {}}
        />

        {destinations.map((x, index) => {
          const hasError: boolean = !!destinationsStatus && destinationsStatus[index]?.status === "error";
          return (
            <Flowpoint
              variant="filled"
              style={{
                backgroundColor: theme.palette.type === "light" ? "#AACAF1" : theme.palette.primary.light,
                border: "1px #AACAF1",
                fontSize: "12px",
                color: hasError ? "#f44336" : "#000",
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
              onClick={() => {}}
            >
              <KTooltip
                title={hasError ? destinationsStatus![index]?.error : ""}
                disableHoverListener={hasError ? false : true}
              >
                <Box display="flex" alignItems="center" marginTop={hasError ? "-3px" : "0"}>
                  {hasError ? <ErrorIcon /> : null}
                  {x.host
                    // .replace(`.${activeNamespaceName}.svc.cluster.local`, "")
                    .replace(`.svc.cluster.local`, "")}
                </Box>
              </KTooltip>
              {size > 1 && <Box>{Math.floor((x.weight / sum) * 1000 + 0.5) / 10}%</Box>}
            </Flowpoint>
          );
        })}
      </Flowspace>
    );
  }
}

export const Targets = withStyles(styles)(withTheme(TargetsRaw));
