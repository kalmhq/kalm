import { Box } from "@material-ui/core";
import React from "react";
import { Node } from "types/node";
import { humanFileSize, sizeStringToNumber } from "utils/sizeConv";
import { ColoredLinearProgress } from "./LinearProgress";
import Immutable from "immutable";

interface Props {
  node: Node;
  showDetails?: boolean;
}

export const NodeMemory = ({ node, showDetails }: Props) => {
  const allocatable = sizeStringToNumber(node.get("status").get("allocatable").get("memory"));
  const requests = sizeStringToNumber(node.get("allocatedResources").get("requests").get("memory"));

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
      {showDetails ? `Allocated ${humanFileSize(requests)}, Total allocatable ${humanFileSize(allocatable)}.` : null}
    </Box>
  );
};

export const NodesMemory = ({ nodes }: { nodes: Immutable.List<Node> }) => {
  let allocatable: number = 0;
  let requests: number = 0;
  nodes.forEach((node) => {
    allocatable = allocatable + sizeStringToNumber(node.get("status").get("allocatable").get("memory"));
    requests = requests + sizeStringToNumber(node.get("allocatedResources").get("requests").get("memory"));
  });

  const progress = (requests / allocatable) * 100;
  return (
    <Box p={2}>
      Allocated {humanFileSize(requests)}, Total allocatable {humanFileSize(allocatable)} Cores of {nodes.size} Nodes.
      <Box pt={1} display="flex" alignItems="center">
        <ColoredLinearProgress style={{ width: "100%" }} variant="determinate" value={progress} />
        <Box ml={1}>({(isNaN(progress) ? 0 : progress).toFixed(2)}%)</Box>
      </Box>
    </Box>
  );
};
