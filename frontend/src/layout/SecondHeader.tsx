import { createStyles, Theme } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { H6 } from "widgets/Label";
import { APP_BAR_HEIGHT, LEFT_SECTION_OPEN_WIDTH, SECOND_HEADER_HEIGHT, SECOND_HEADER_ZINDEX } from "./Constants";

const mapStateToProps = (state: RootState) => {
  return {};
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      position: "sticky",
      top: APP_BAR_HEIGHT,
      zIndex: SECOND_HEADER_ZINDEX,
      height: SECOND_HEADER_HEIGHT,
      width: "100%",
      background: theme.palette.background.paper,
      // borderBottom: `1px solid ${theme.palette.divider}`,
      display: "flex",
      marginBottom: 8,
    },
    left: {
      width: LEFT_SECTION_OPEN_WIDTH,
      height: SECOND_HEADER_HEIGHT,
      // borderRight: `1px solid ${theme.palette.divider}`,
    },
    leftTextContainer: {
      display: "flex",
      alignItems: "center",
      paddingLeft: 32,
      // borderRight: `1px solid ${theme.palette.divider}`,
    },
    right: {
      flex: 1,
      height: SECOND_HEADER_HEIGHT,
      display: "flex",
      alignItems: "center",
      paddingTop: 16,
      "& > *": {
        marginLeft: 20,
      },
      background: theme.palette.type === "light" ? "#F5F5F5" : "#212121",
    },
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
  left?: any;
  right?: any;
}

interface State {}

class SecondHeaderRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  render() {
    const { classes, left, right } = this.props;

    return (
      <div className={classes.root}>
        {left ? (
          <div className={`${classes.left} ${typeof left === "string" ? classes.leftTextContainer : ""}`}>
            {typeof left === "string" ? <H6>{left}</H6> : left}
          </div>
        ) : null}

        <div className={classes.right}>{typeof right === "string" ? <H6>{right}</H6> : right}</div>
      </div>
    );
  }
}

export const SecondHeader = connect(mapStateToProps)(withStyles(styles)(SecondHeaderRaw));
