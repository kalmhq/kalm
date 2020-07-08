import { Box, LinearProgress } from "@material-ui/core";
import React from "react";
import { Node } from "types/node";
import { sizeStringToNumber } from "utils/sizeConv";

export const NodeCPU = ({ node }: { node: Node }) => {
  const allocatable = sizeStringToNumber(node.get("status").get("allocatable").get("cpu"));
  const capacity = sizeStringToNumber(node.get("status").get("capacity").get("cpu"));
  const progress = ((capacity - allocatable) / capacity) * 100;
  return (
    <Box>
      <Box mr={2} display="inline-block">
        <LinearProgress
          style={{ width: "120px", display: "inline-block", verticalAlign: "middle" }}
          variant="determinate"
          value={progress}
        />{" "}
        ({progress.toFixed(2)}%)
      </Box>
      allocatable {allocatable.toFixed(2)} Cores, capacity {capacity.toFixed(2)} Cores.
    </Box>
  );
};
