import { Box, LinearProgress } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import { WithData } from "hoc/withData";
import { TutorialDrawer } from "pages/Tutorial";
import { RequireAuthorizated } from "permission/Authorization";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { getHasTenant } from "selectors/tenant";
import { TDispatchProp } from "types";
import { AppBarComponent } from "./AppBar";
import { APP_BAR_HEIGHT, TOP_PROGRESS_ZINDEX, TUTORIAL_DRAWER_WIDTH, LEFT_SECTION_OPEN_WIDTH } from "./Constants";
import { ErrorBoundary } from "./ErrorBoundary";
import { RootDrawer } from "./RootDrawer";

const styles = (theme: Theme) => {
  return createStyles({
    root: {
      display: "flex",
      height: "100%",
    },
    progress: {
      position: "fixed",
      top: "0",
      zIndex: TOP_PROGRESS_ZINDEX,
      width: "100%",
      height: "2px",
    },
    mainContent: {
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      marginRight: -1 * TUTORIAL_DRAWER_WIDTH,

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
    isShowTopProgress: state.settings.isShowTopProgress,
    showTutorialDrawer: state.tutorial.drawerOpen,
    hasTenant: getHasTenant(state),
  };
};

interface Props
  extends WithStyles<typeof styles>,
    React.Props<any>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp {}

class DashboardLayoutRaw extends React.PureComponent<Props> {
  render() {
    const { classes, children, isShowTopProgress, showTutorialDrawer, hasTenant } = this.props;
    return (
      <ErrorBoundary>
        <div className={classes.root}>
          <div
            className={clsx(classes.mainContent, {
              [classes.mainContentShift]: showTutorialDrawer,
            })}
          >
            {isShowTopProgress ? <LinearProgress className={classes.progress} /> : null}

            <AppBarComponent />

            <Box display="flex" flex="1" marginTop={APP_BAR_HEIGHT + "px"}>
              {hasTenant && (
                <Box maxWidth={LEFT_SECTION_OPEN_WIDTH}>
                  <RootDrawer />
                </Box>
              )}
              <Box flex="1" display="flex">
                {children}
              </Box>
            </Box>
          </div>

          {hasTenant && <TutorialDrawer />}

          <WithData />
        </div>
      </ErrorBoundary>
    );
  }
}

export const DashboardLayout = withStyles(styles)(RequireAuthorizated(connect(mapStateToProps)(DashboardLayoutRaw)));
