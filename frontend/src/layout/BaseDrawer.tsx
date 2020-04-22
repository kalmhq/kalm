import { Drawer, createStyles, Theme } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { LEFT_SECTION_WIDTH } from "../pages/BasePage";

const mapStateToProps = (state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    drawer: {
      width: LEFT_SECTION_WIDTH,
      flexShrink: 0
    },
    drawerPaper: {
      width: LEFT_SECTION_WIDTH,
      paddingTop: 48
    },
    drawerContainer: {
      overflow: "auto"
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
  children: any;
}

interface State {}

class BaseDrawerRaw extends React.PureComponent<Props, State> {
  private headerRef = React.createRef<React.ReactElement>();

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
          paper: classes.drawerPaper
        }}>
        <div className={classes.drawerContainer}>{children}</div>
      </Drawer>
    );
  }
}

export const BaseDrawer = connect(mapStateToProps)(withStyles(styles)(BaseDrawerRaw));
