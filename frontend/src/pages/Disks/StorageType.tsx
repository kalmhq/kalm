import React from "react";
import { Box, Button, Popover } from "@material-ui/core";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import Immutable from "immutable";
import { ImmutableMap } from "typings";

export class StorageType extends React.PureComponent {
  public render() {
    const disksTypes: Immutable.List<ImmutableMap<{ name: string }>> = Immutable.fromJS([
      {
        name: "ssd",
      },
      {
        name: "hhd",
      },
    ]);

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
                items={disksTypes
                  .map((x) => ({
                    name: "Type: " + x.get("name"),
                    content: (
                      <Box>
                        <Button variant="text" href="#">
                          Details
                        </Button>
                      </Box>
                    ),
                  }))
                  .toArray()}
              />
            </Popover>
          </>
        )}
      </PopupState>
    );
  }
}
