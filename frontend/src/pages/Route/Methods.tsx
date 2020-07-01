import { Box } from "@material-ui/core";
import { WhiteTooltip } from "forms/Application/KappTooltip";
import Immutable from "immutable";
import React from "react";
import { httpMethods } from "types/route";
import { KChip } from "widgets/Chip";

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
