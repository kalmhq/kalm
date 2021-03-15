import { Button, createStyles, Paper, Popover, Popper, Theme, withStyles, WithStyles } from "@material-ui/core";
import { blinkTopProgressAction } from "actions/settings";
import { POPPER_ZINDEX } from "layout/Constants";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import React from "react";
import { customBindHover, customBindPopover } from "utils/popper";
import { DeleteConfirmBox } from "widgets/DeleteConfirmBox";
import { FlexRowItemCenterBox } from "./Box";
import { DeleteIcon } from "./Icon";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

interface Props {
  popupId: string;
  icon: any;
  popoverBody: any;
  mr?: number;
}

export class IconWithPopover extends React.PureComponent<Props> {
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
                <Paper variant="outlined">{popoverBody}</Paper>
              </Popper>
            </>
          );
        }}
      </PopupState>
    );
  }
}

interface ConfirmPopoverProps {
  popupId: string;
  confirmedAction: any;
  popupTitle: React.ReactNode;
  popupContent?: React.ReactNode;
  targetText?: string;
  useText?: boolean;
  text?: string;
  label?: string;
  iconSize?: "medium" | "small";
  disabled?: boolean;
}

const styles = (theme: Theme) =>
  createStyles({
    deleteButton: {
      borderColor: theme.palette.error.main,
      color: theme.palette.error.main,
    },
  });

class DeleteButtonWithConfirmPopoverRaw extends React.PureComponent<ConfirmPopoverProps & WithStyles<typeof styles>> {
  render() {
    const {
      popupId,
      popupTitle,
      popupContent,
      confirmedAction,
      classes,
      useText,
      targetText,
      label,
      text,
      iconSize,
      disabled,
    } = this.props;
    return (
      <PopupState variant="popover" popupId={popupId}>
        {(popupState) => {
          const trigger = bindTrigger(popupState);
          const popover = customBindPopover(popupState);
          return (
            <span>
              {useText ? (
                <Button
                  className={classes.deleteButton}
                  variant="outlined"
                  component="div"
                  size="small"
                  disabled={disabled}
                  {...trigger}
                  onClick={(e: React.SyntheticEvent<any, Event>) => {
                    e.stopPropagation();
                    trigger.onClick(e);
                  }}
                >
                  {text ? text : "Delete"}
                </Button>
              ) : (
                <IconButtonWithTooltip
                  size={iconSize}
                  tooltipTitle="Delete"
                  aria-label="delete"
                  disabled={disabled}
                  {...trigger}
                >
                  <DeleteIcon />
                </IconButtonWithTooltip>
              )}
              <Popover
                style={{ zIndex: POPPER_ZINDEX }}
                onClick={(e: React.SyntheticEvent<any, Event>) => e.stopPropagation()}
                {...popover}
              >
                <DeleteConfirmBox
                  popupTitle={popupTitle}
                  label={label ?? ""}
                  placeholder={targetText ?? ""}
                  target={targetText}
                  popupContent={popupContent}
                  deleteAction={(e) => {
                    e.stopPropagation();
                    blinkTopProgressAction();
                    confirmedAction();
                    popover.onClose();
                  }}
                  cancelAction={(e) => {
                    e.stopPropagation();
                    popover.onClose();
                  }}
                />
              </Popover>
            </span>
          );
        }}
      </PopupState>
    );
  }
}

export const DeleteButtonWithConfirmPopover = withStyles(styles)(DeleteButtonWithConfirmPopoverRaw);
