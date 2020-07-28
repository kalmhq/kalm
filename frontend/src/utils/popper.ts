import { bindHover } from "material-ui-popup-state";

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
