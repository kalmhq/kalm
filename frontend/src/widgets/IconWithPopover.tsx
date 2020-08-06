import React from "react";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import { FlexRowItemCenterBox } from "./Box";
import {
  Popper,
  Paper,
  Grid,
  Button,
  Popover,
  withStyles,
  createStyles,
  Theme,
  WithStyles,
  Box,
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
                <Paper>{popoverBody}</Paper>
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
    const { popupId, popupTitle, confirmedAction, classes, useText, iconSize } = this.props;
    return (
      <PopupState variant="popover" popupId={popupId}>
        {(popupState) => {
          const trigger = bindTrigger(popupState);
          const { onClick } = trigger;
          const popover = customBindPopover(popupState);
          return (
            <>
              {useText ? (
                <Button
                  className={classes.deleteButton}
                  variant="outlined"
                  component="span"
                  size="small"
                  {...trigger}
                  onClick={(event: React.SyntheticEvent<any, Event>) => {
                    onClick(event);
                    event.stopPropagation();
                  }}
                >
                  Delete
                </Button>
              ) : (
                <IconButtonWithTooltip size={iconSize} tooltipTitle="Delete" aria-label="delete" {...trigger}>
                  <DeleteIcon />
                </IconButtonWithTooltip>
              )}
              <Popover style={{ zIndex: POPPER_ZINDEX }} {...popover}>
                <Paper>
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
                          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            blinkTopProgressAction();
                            confirmedAction();
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
                          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            popover.onClose();
                          }}
                        >
                          Cancel
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Popover>
            </>
          );
        }}
      </PopupState>
    );
  }
}

export const DeleteButtonWithConfirmPopover = withStyles(styles)(DeleteButtonWithConfirmPopoverRaw);
