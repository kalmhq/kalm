import { Box, LinearProgress } from "@material-ui/core";
import { Node } from "types/node";
import React from "react";
import { sizeStringToNumber, humanFileSize } from "utils/sizeConv";

export const NodeMemory = ({ node }: { node: Node }) => {
  const allocatable = sizeStringToNumber(node.get("status").get("allocatable").get("memory"));
  const requests = sizeStringToNumber(node.get("allocatedResources").get("requests").get("memory"));

  const progress = (requests / allocatable) * 100;
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
      Allocated {humanFileSize(requests)}, Total allocatable {humanFileSize(allocatable)}.
    </Box>
  );
};
