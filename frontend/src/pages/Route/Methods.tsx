import React from "react";
import { Tooltip } from "@material-ui/core";
import Immutable from "immutable";

export const Methods = ({ methods }: { methods: Immutable.List<string> }) => {
  if (methods.size < 3) {
    return <span>{methods.join(", ")}</span>;
  } else {
    return (
      <Tooltip title={methods.join(", ")}>
        <span>{methods.slice(0, 2).join(", ") + ` (${methods.size - 2} more)`}</span>
      </Tooltip>
    );
  }
};
