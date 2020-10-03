import React from "react";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import { FlexRowItemCenterBox } from "./Box";
import {
  Box,
  Button,
  createStyles,
  Grid,
  Paper,
  Popover,
  Popper,
  Theme,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import { POPPER_ZINDEX } from "layout/Constants";
import { customBindHover, customBindPopover } from "utils/popper";
import { DeleteIcon } from "./Icon";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import { Subtitle2 } from "./Label";
import { blinkTopProgressAction } from "actions/settings";

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
                <Paper variant="outlined" square>
                  {popoverBody}
                </Paper>
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
  popupTitle: string;
  useText?: boolean;
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
    const { popupId, popupTitle, confirmedAction, classes, useText, iconSize, disabled } = this.props;
    return (
      <PopupState variant="popover" popupId={popupId}>
        {(popupState) => {
          const trigger = bindTrigger(popupState);
          const popover = customBindPopover(popupState);
          return (
            <>
              {useText ? (
                <Button
                  className={classes.deleteButton}
                  variant="outlined"
                  component="span"
                  size="small"
                  disabled={disabled}
                  {...trigger}
                  onClick={(e: React.SyntheticEvent<any, Event>) => {
                    e.stopPropagation();
                    trigger.onClick(e);
                  }}
                >
                  Delete
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
                <Box p={2}>
                  <Subtitle2>{popupTitle}</Subtitle2>
                </Box>
                <Box p={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        className={classes.deleteButton}
                        variant="outlined"
                        fullWidth
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          blinkTopProgressAction();
                          confirmedAction();
                          popover.onClose();
                        }}
                      >
                        Delete
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          popover.onClose();
                        }}
                      >
                        Cancel
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Popover>
            </>
          );
        }}
      </PopupState>
    );
  }
}

export const DeleteButtonWithConfirmPopover = withStyles(styles)(DeleteButtonWithConfirmPopoverRaw);
