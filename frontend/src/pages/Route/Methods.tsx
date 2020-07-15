import { Box, Fade, Paper, Popper } from "@material-ui/core";
import Immutable from "immutable";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState, { bindHover, bindPopover, bindPopper } from "material-ui-popup-state";
import React from "react";
import { httpMethods } from "types/route";
import { KChip } from "widgets/Chip";

export const Methods = ({ methods }: { methods: Immutable.List<string> }) => {
  return (
    <>
      <PopupState variant="popper" popupId="methods-popup-popper">
        {(popupState) => {
          // delete popupState.disableEnforceFocus;

          const hoverProps = bindHover(popupState);
          const popupProps = bindPopover(popupState);
          delete popupProps.anchorEl;
          // @ts-ignore
          delete popupProps.disableAutoFocus;
          // @ts-ignore
          delete popupProps.disableEnforceFocus;
          // @ts-ignore
          delete popupProps.disableRestoreFocus;
          return (
            <div>
              <KChip
                label={methods.size === httpMethods.length ? "All" : "Custom"}
                color="primary"
                {...hoverProps}
                // for when mouse leave to poper, if not bindPopover will can't dismiss poper
                {...popupProps}
              />

              <Popper {...bindPopper(popupState)} style={{ zIndex: POPPER_ZINDEX }} transition>
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
