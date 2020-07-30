import { bindHover, bindPopover } from "material-ui-popup-state";

export const customBindHover = (popupState: any) => {
  const hoverProps = bindHover(popupState);

  // @ts-ignore
  delete hoverProps.disableAutoFocus;
  // @ts-ignore
  delete hoverProps.disableEnforceFocus;
  // @ts-ignore
  delete hoverProps.disableRestoreFocus;

  return {
    ...hoverProps,
  };
};

export const customBindPopover = (popupState: any) => {
  const popoverProps = bindPopover(popupState);

  // @ts-ignore
  delete popoverProps.disableAutoFocus;
  // @ts-ignore
  delete popoverProps.disableEnforceFocus;
  // @ts-ignore
  delete popoverProps.disableRestoreFocus;

  return {
    ...popoverProps,
  };
};
