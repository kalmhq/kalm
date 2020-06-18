import { useSnackbar, SnackbarProvider } from "notistack";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import { withStyles, Theme, createStyles, WithStyles } from "@material-ui/core";
import { tutorialDrawerWidth } from "pages/Tutorial";

const getMessageFromState = (state: RootState) => ({
  message: state.get("notification"),
});

const NotificationComponent = connect(getMessageFromState)(({ message }: ReturnType<typeof getMessageFromState>) => {
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (!message.get("message")) {
      return;
    }

    enqueueSnackbar(message.get("message"), {
      variant: message.get("variant"),
    });
  }, [enqueueSnackbar, message]);

  return null;
});

const mapStateToProps = (state: RootState) => {
  return { isTutorialDrawerOpen: state.get("tutorial").get("drawerOpen") };
};

const styles = (theme: Theme) =>
  createStyles({
    containerRoot: {
      zIndex: 1400,
    },
    root: {
      transition: theme.transitions.create("margin-right", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    anchorOriginBottomRightWhenTutorialOpen: {
      marginRight: tutorialDrawerWidth,
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
            }}>
            <NotificationComponent />
          </SnackbarProvider>
        );
      }
    },
  ),
);
