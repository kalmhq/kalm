import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { RootState } from "configureStore";
import { SNACKBAR_ZINDEX, TUTORIAL_DRAWER_WIDTH } from "layout/Constants";
import { SnackbarProvider, useSnackbar } from "notistack";
import React from "react";
import { connect } from "react-redux";

const getMessageFromState = (state: RootState) => ({
  message: state.notification,
});

const NotificationComponent = connect(getMessageFromState)(({ message }: ReturnType<typeof getMessageFromState>) => {
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (!message.message) {
      return;
    }

    enqueueSnackbar(message.message, {
      variant: message.variant,
    });
  }, [enqueueSnackbar, message]);

  return null;
});

const mapStateToProps = (state: RootState) => {
  return { isTutorialDrawerOpen: state.tutorial.drawerOpen };
};

const styles = (theme: Theme) =>
  createStyles({
    containerRoot: {
      zIndex: SNACKBAR_ZINDEX,
    },
    root: {
      transition: theme.transitions.create("margin-right", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    anchorOriginBottomRightWhenTutorialOpen: {
      marginRight: TUTORIAL_DRAWER_WIDTH,
    },
  });

export const Snackbar = connect(mapStateToProps)(
  withStyles(styles)(
    class extends React.PureComponent<ReturnType<typeof mapStateToProps> & WithStyles<typeof styles>> {
      public render() {
        const { isTutorialDrawerOpen, classes } = this.props;

        return (
          <SnackbarProvider
            classes={{
              containerAnchorOriginBottomRight: classes.containerRoot,
              root: classes.root,
              anchorOriginBottomRight: isTutorialDrawerOpen
                ? classes.anchorOriginBottomRightWhenTutorialOpen
                : undefined,
            }}
            maxSnack={3}
            anchorOrigin={{
              horizontal: "right",
              vertical: "bottom",
            }}
          >
            <NotificationComponent />
          </SnackbarProvider>
        );
      }
    },
  ),
);
