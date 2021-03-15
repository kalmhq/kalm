import { Box, Button, Popover } from "@material-ui/core";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import React from "react";
import { StorageClasses } from "types/disk";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";

interface Props {
  storageClasses: StorageClasses;
}

export const StorageType: React.FC<Props> = (props) => {
  const { storageClasses } = props;
  return (
    <PopupState variant="popover" popupId={"disks-creation-helper"}>
      {(popupState) => (
        <>
          <Button color="primary" size="small" variant="text" {...bindTrigger(popupState)}>
            Type of storage
          </Button>
          <Popover
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
            <VerticalHeadTable
              items={storageClasses.map((x) => ({
                name: "Type: " + x.name,
                content: (
                  <Box>
                    <Button variant="text" href={x.docLink} target="_blank">
                      Details
                    </Button>
                  </Box>
                ),
              }))}
            />
          </Popover>
        </>
      )}
    </PopupState>
  );
};
