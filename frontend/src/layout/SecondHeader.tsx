import { createStyles, Theme } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { H4 } from "widgets/Label";
import { SECOND_HEADER_HEIGHT, LEFT_SECTION_OPEN_WIDTH, SECOND_HEADER_ZINDEX, APP_BAR_HEIGHT } from "./Constants";

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
      // background: "white",
      borderBottom: `1px solid ${grey[200]}`,
      display: "flex",
    },
    left: {
      width: LEFT_SECTION_OPEN_WIDTH,
      height: SECOND_HEADER_HEIGHT,
      borderRight: `1px solid ${grey[200]}`,
    },
    leftTextContainer: {
      display: "flex",
      alignItems: "center",
      paddingLeft: 32,
      borderRight: `1px solid ${grey[200]}`,
    },
    right: {
      flex: 1,
      height: SECOND_HEADER_HEIGHT,
      display: "flex",
      alignItems: "center",
      "& > *": {
        marginLeft: 20,
      },
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
            {typeof left === "string" ? <H4>{left}</H4> : left}
          </div>
        ) : null}

        <div className={classes.right}>{typeof right === "string" ? <H4>{right}</H4> : right}</div>
      </div>
    );
  }
}

export const SecondHeader = connect(mapStateToProps)(withStyles(styles)(SecondHeaderRaw));
