import React from "react";
import PopupState, { bindPopover, bindHover } from "material-ui-popup-state";
import { FlexRowItemCenterBox } from "./Box";
import { Popper, Paper } from "@material-ui/core";
import { POPPER_ZINDEX } from "layout/Constants";

interface Props {
  popupId: string;
  icon: any;
  popoverBody: any;
}

class IconWithPopover extends React.PureComponent<Props> {
  render() {
    const { icon, popoverBody, popupId } = this.props;
    return (
      <PopupState variant="popover" popupId={popupId}>
        {(popupState) => {
          return (
            <>
              <FlexRowItemCenterBox mr={1} {...bindHover(popupState)}>
                {icon}
              </FlexRowItemCenterBox>
              <Popper style={{ zIndex: POPPER_ZINDEX }} {...bindPopover(popupState)}>
                <Paper>{popoverBody}</Paper>
              </Popper>
            </>
          );
        }}
      </PopupState>
    );
  }
}

export default IconWithPopover;
