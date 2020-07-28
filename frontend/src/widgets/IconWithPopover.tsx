import React from "react";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import { FlexRowItemCenterBox } from "./Box";
import { Popover } from "@material-ui/core";
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
          const trigger = bindTrigger(popupState);
          return (
            <>
              <FlexRowItemCenterBox onMouseEnter={trigger.onClick} {...trigger}>
                {icon}
              </FlexRowItemCenterBox>
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
                {popoverBody}
              </Popover>
            </>
          );
        }}
      </PopupState>
    );
  }
}

export default IconWithPopover;
