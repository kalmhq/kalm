import { Box, LinearProgress } from "@material-ui/core";
import React from "react";
import { Node } from "types/node";
import { sizeStringToNumber } from "utils/sizeConv";

export const NodePods = ({ node }: { node: Node }) => {
  const allocatable = sizeStringToNumber(node.get("status").get("allocatable").get("pods"));
  const allocated = node.get("allocatedResources").get("podsCount");
  const progress = (allocated / allocatable) * 100;
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
      Allocated {allocated} pods, Total allocatable {allocatable} pods.
    </Box>
  );
};
