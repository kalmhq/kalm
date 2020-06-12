import { LinearProgress } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import { RequireAuthorizated } from "permission/Authorization";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { AppBarComponent, APP_BAR_HEIGHT } from "./AppBar";
import { RootDrawer } from "./RootDrawer";
import { SECOND_HEADER_HEIGHT } from "./SecondHeader";

const styles = (theme: Theme) => {
  return createStyles({
    root: {
      display: "flex",
      height: "100%"
    },
    content: {
      flexGrow: 1,
      paddingTop: APP_BAR_HEIGHT + SECOND_HEADER_HEIGHT,
      height: "100%",
      // maxWidth: "1200px",
      margin: "0 auto"
    },
    progress: {
      position: "fixed",
      top: "0",
      zIndex: 9999,
      width: "100%",
      height: "2px"
    }
  });
};

const mapStateToProps = (state: RootState) => {
  return {
    isShowTopProgress: state.get("settings").get("isShowTopProgress")
  };
};

interface Props extends WithStyles<typeof styles>, React.Props<any>, ReturnType<typeof mapStateToProps> {}

class DashboardLayoutRaw extends React.PureComponent<Props> {
  render() {
    const { classes, children, isShowTopProgress } = this.props;
    return (
      <div className={classes.root}>
        {isShowTopProgress ? <LinearProgress className={classes.progress} /> : null}
        <AppBarComponent />
        <RootDrawer />
        <main className={classes.content}>{children}</main>
      </div>
    );
  }
}

export const DashboardLayout = withStyles(styles)(RequireAuthorizated(connect(mapStateToProps)(DashboardLayoutRaw)));
