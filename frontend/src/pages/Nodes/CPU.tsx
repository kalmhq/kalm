import { Box } from "@material-ui/core";
import React from "react";
import { Node } from "types/node";
import { sizeStringToNumber } from "utils/sizeConv";
import { ColoredLinearProgress } from "./LinearProgress";

interface Props {
  node: Node;
  showDetails?: boolean;
}

export const NodeCPU = ({ node, showDetails }: Props) => {
  const allocatable = sizeStringToNumber(node.status.allocatable.cpu);
  const requests = sizeStringToNumber(node.allocatedResources.requests.cpu);

  const progress = (requests / allocatable) * 100;
  return (
    <Box>
      <Box mr={2} display="inline-block">
        <ColoredLinearProgress
          style={{ width: "120px", display: "inline-block", verticalAlign: "middle" }}
          variant="determinate"
          value={progress}
        />{" "}
        ({progress.toFixed(2)}%)
      </Box>
      {showDetails
        ? `Allocated ${requests.toFixed(2)} Cores, Total allocatable ${allocatable.toFixed(2)} Cores.`
        : null}
    </Box>
  );
};

export const NodesCPU = ({ nodes }: { nodes: Node[] }) => {
  let allocatable: number = 0;
  let requests: number = 0;

  nodes.forEach((node) => {
    allocatable = allocatable + sizeStringToNumber(node.status.allocatable.cpu);
    requests = requests + sizeStringToNumber(node.allocatedResources.requests.cpu);
  });

  const progress = (requests / allocatable) * 100;
  return (
    <Box p={2}>
      Allocated {requests.toFixed(2)} Cores, Total allocatable {allocatable.toFixed(2)} Cores of {nodes.length} Nodes.
      <Box pt={1} display="flex" alignItems="center">
        <ColoredLinearProgress style={{ width: "100%" }} variant="determinate" value={progress} />
        <Box ml={1}>({(isNaN(progress) ? 0 : progress).toFixed(2)}%)</Box>
      </Box>
    </Box>
  );
};
