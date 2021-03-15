import { Box, Fade, Paper, Popper } from "@material-ui/core";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState from "material-ui-popup-state";
import React from "react";
import { httpMethods } from "types/route";
import { customBindHover, customBindPopover } from "utils/popper";
import { KChip } from "widgets/Chip";

export const Methods = ({ methods }: { methods: string[] }) => {
  return (
    <>
      <PopupState variant="popper" popupId="methods-popup-popper">
        {(popupState) => {
          return (
            <div>
              <KChip
                label={methods.length === httpMethods.length ? "All" : "Custom"}
                color="primary"
                {...customBindHover(popupState)}
              />

              <Popper {...customBindPopover(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
                {({ TransitionProps }) => (
                  <Fade {...TransitionProps} timeout={100}>
                    <Paper variant="outlined">
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
