import { Box, LinearProgress } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import { TutorialDrawer, tutorialDrawerWidth } from "pages/Tutorial";
import { RequireAuthorizated } from "permission/Authorization";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { AppBarComponent } from "./AppBar";
import { RootDrawer } from "./RootDrawer";
import { WebsocketConnector } from "./WebsocketConnector";
import { TDispatchProp } from "types";
import { loadClusterInfoAction } from "actions/cluster";

const styles = (theme: Theme) => {
  return createStyles({
    root: {
      display: "flex",
      height: "100%",
    },
    progress: {
      position: "fixed",
      top: "0",
      zIndex: 9999,
      width: "100%",
      height: "2px",
    },
    mainContent: {
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      marginRight: -1 * tutorialDrawerWidth,

      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    mainContentShift: {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: 0,
    },
  });
};

const mapStateToProps = (state: RootState) => {
  return {
    isShowTopProgress: state.get("settings").get("isShowTopProgress"),
    showTutorialDrawer: state.get("tutorial").get("drawerOpen"),
  };
};

interface Props
  extends WithStyles<typeof styles>,
    React.Props<any>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp {}

class DashboardLayoutRaw extends React.PureComponent<Props> {
  componentDidMount(): void {
    this.props.dispatch(loadClusterInfoAction());
  }

  render() {
    const { classes, children, isShowTopProgress, showTutorialDrawer } = this.props;
    return (
      <div className={classes.root}>
        <div
          className={clsx(classes.mainContent, {
            [classes.mainContentShift]: showTutorialDrawer,
          })}
        >
          {isShowTopProgress ? <LinearProgress className={classes.progress} /> : null}

          <AppBarComponent />

          <Box display="flex">
            <RootDrawer />
            <Box flex="1">{children}</Box>
          </Box>
        </div>

        <TutorialDrawer />

        <WebsocketConnector />
      </div>
    );
  }
}

export const DashboardLayout = withStyles(styles)(RequireAuthorizated(connect(mapStateToProps)(DashboardLayoutRaw)));
