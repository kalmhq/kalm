import { Box } from "@material-ui/core";
import React from "react";
import { Node } from "types/node";
import { humanFileSize, sizeStringToNumber } from "utils/sizeConv";
import { ColoredLinearProgress } from "./LinearProgress";

export const NodeMemory = ({ node }: { node: Node }) => {
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
      Allocated {humanFileSize(requests)}, Total allocatable {humanFileSize(allocatable)}.
    </Box>
  );
};
