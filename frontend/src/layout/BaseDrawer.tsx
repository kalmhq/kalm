import { createStyles, Drawer, Theme } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { LEFT_SECTION_OPEN_WIDTH } from "../pages/BasePage";
import { APP_BAR_HEIGHT } from "./AppBar";
import { SECOND_HEADER_HEIGHT } from "./SecondHeader";

const mapStateToProps = (state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    drawer: {
      width: LEFT_SECTION_OPEN_WIDTH,
      flexShrink: 0,
    },
    drawerPaper: {
      width: LEFT_SECTION_OPEN_WIDTH,
      paddingTop: APP_BAR_HEIGHT + SECOND_HEADER_HEIGHT,
      left: "auto",
    },
    drawerContainer: {
      overflow: "auto",
    },
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
  children: any;
}

interface State {}

class BaseDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  render() {
    const { classes, children } = this.props;

    return (
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.drawerContainer}>{children}</div>
      </Drawer>
    );
  }
}

export const BaseDrawer = connect(mapStateToProps)(withStyles(styles)(BaseDrawerRaw));
