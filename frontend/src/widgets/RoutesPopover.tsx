import React from "react";
import { Box, Popover } from "@material-ui/core";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import { RouteWidgets } from "pages/Route/Widget";
import { HttpRoute } from "types/route";
import { pluralize } from "utils/string";
import { KMLink } from "widgets/Link";

interface IRoutesPopover {
  applicationRoutes: HttpRoute[];
  applicationName: string;
  canEdit: boolean;
}
export const RoutesPopover = ({ applicationRoutes, applicationName, canEdit }: IRoutesPopover) => {
  return (
    <PopupState variant="popover" popupId={applicationName}>
      {(popupState) => (
        <>
          <KMLink component="button" variant="body2" color={"inherit"} {...bindTrigger(popupState)}>
            {pluralize("route", applicationRoutes.length)}
          </KMLink>
          <Popover
            style={{ zIndex: POPPER_ZINDEX }}
            {...bindPopover(popupState)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            <Box p={2}>
              <RouteWidgets routes={applicationRoutes} canEdit={canEdit} />
            </Box>
          </Popover>
        </>
      )}
    </PopupState>
  );
};
