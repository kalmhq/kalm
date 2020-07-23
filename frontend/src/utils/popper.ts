import { bindHover, bindPopover } from "material-ui-popup-state";

export const customBindHover = (popupState: any) => {
  const hoverProps = bindHover(popupState);
  // for when mouse leave to poper, if not bindPopover will can't dismiss poper
  const popupProps = bindPopover(popupState);

  delete popupProps.anchorEl;
  // @ts-ignore
  delete popupProps.disableAutoFocus;
  // @ts-ignore
  delete popupProps.disableEnforceFocus;
  // @ts-ignore
  delete popupProps.disableRestoreFocus;

  return {
    ...hoverProps,
    ...popupProps,
  };
};
