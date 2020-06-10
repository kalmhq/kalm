import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import React from "react";
import { RootState } from "reducers";
import { connect } from "react-redux";
import { RequireAuthorizated } from "permission/Authorization";
import { AppBarComponent, APP_BAR_HEIGHT } from "./AppBar";
import { SECOND_HEADER_HEIGHT } from "./SecondHeader";
import { RootDrawer } from "./RootDrawer";

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
    }
  });
};

const mapStateToProps = (state: RootState) => {
  return {
    activeNamespaceName: state.get("namespaces").get("active")
  };
};

interface Props extends WithStyles<typeof styles>, React.Props<any>, ReturnType<typeof mapStateToProps> {}

class DashboardRaw extends React.PureComponent<Props> {
  render() {
    const { classes, children, activeNamespaceName } = this.props;
    return (
      <div className={classes.root}>
        <AppBarComponent title="KApp Dashboard" key={activeNamespaceName} />
        <RootDrawer />
        <main className={classes.content}>{children}</main>
      </div>
    );
  }
}

export const Dashboard = withStyles(styles)(RequireAuthorizated(connect(mapStateToProps)(DashboardRaw)));
