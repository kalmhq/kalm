import React from "react";
import PopupState from "material-ui-popup-state";
import { FlexRowItemCenterBox } from "./Box";
import { Popper, Paper } from "@material-ui/core";
import { POPPER_ZINDEX } from "layout/Constants";
import { customBindHover, customBindPopover } from "utils/popper";

interface Props {
  popupId: string;
  icon: any;
  popoverBody: any;
  mr?: number;
}

class IconWithPopover extends React.PureComponent<Props> {
  render() {
    const { icon, popoverBody, popupId, mr } = this.props;
    return (
      <PopupState variant="popover" popupId={popupId}>
        {(popupState) => {
          return (
            <>
              <FlexRowItemCenterBox {...customBindHover(popupState)} mr={mr}>
                {icon}
              </FlexRowItemCenterBox>
              <Popper style={{ zIndex: POPPER_ZINDEX }} {...customBindPopover(popupState)}>
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
