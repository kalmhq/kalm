import React from "react";
import { Tooltip, Box } from "@material-ui/core";
import Immutable from "immutable";
import { KChip } from "widgets/Chip";
import { WhiteTooltip } from "forms/Application/KappTooltip";
import { httpMethods } from "types/route";

export const Methods = ({ methods }: { methods: Immutable.List<string> }) => {
  return (
    <WhiteTooltip
      title={
        <Box display={"flex"} width={300} flexWrap={"wrap"} pt={1}>
          {httpMethods.map((m) => {
            return (
              <Box mr={1} mb={1}>
                <KChip label={m} color="primary" disabled={!methods.includes(m)} />
              </Box>
            );
          })}
        </Box>
      }
    >
      <span>
        <KChip label={methods.size === httpMethods.length ? "All" : "Custom"} color="primary" />
      </span>
    </WhiteTooltip>
  );
};
