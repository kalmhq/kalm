import { Box, Fade, Paper, Popper } from "@material-ui/core";
import Immutable from "immutable";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState, { bindPopover } from "material-ui-popup-state";
import React from "react";
import { httpMethods } from "types/route";
import { KChip } from "widgets/Chip";
import { customBindHover } from "utils/popper";

export const Methods = ({ methods }: { methods: Immutable.List<string> }) => {
  return (
    <>
      <PopupState variant="popper" popupId="methods-popup-popper">
        {(popupState) => {
          return (
            <div>
              <KChip
                label={methods.size === httpMethods.length ? "All" : "Custom"}
                color="primary"
                {...customBindHover(popupState)}
              />

              <Popper {...bindPopover(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
                {({ TransitionProps }) => (
                  <Fade {...TransitionProps} timeout={100}>
                    <Paper>
                      <Box display={"flex"} width={300} flexWrap={"wrap"} pt={1} pl={1}>
                        {httpMethods.map((m) => {
                          return (
                            <Box mr={1} mb={1} key={m}>
                              <KChip label={m} color="primary" disabled={!methods.includes(m)} />
                            </Box>
                          );
                        })}
                      </Box>
                    </Paper>
                  </Fade>
                )}
              </Popper>
            </div>
          );
        }}
      </PopupState>
    </>
  );
};
