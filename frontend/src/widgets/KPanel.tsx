import { Box, createStyles, Paper, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Subtitle1 } from "widgets/Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    paper: {},
    borderBottom: {
      // borderBottom: `1px solid ${theme.palette.divider}`,
      // height: "40px",
      // padding: `0 ${theme.spacing(2)}px`,
      // display: "flex",
      // alignItems: "center",
    },
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

// const PANEL_DEFAULT_MAX_WITDTH = 800;

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  title?: React.ReactNode;
  content?: React.ReactNode;
  maxWidth?: number | string;
  style?: React.CSSProperties;
}

interface State {}

class KPanelRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { classes, title, content, children, style } = this.props;
    return (
      <Paper variant="outlined" style={style} className={classes.paper}>
        {title && (
          <Box p={2} className={classes.borderBottom}>
            <Subtitle1>
              <strong>{title}</strong>
            </Subtitle1>
          </Box>
        )}
        {content || children}
      </Paper>
    );
  }
}

export const KPanel = withStyles(styles)(connect(mapStateToProps)(KPanelRaw));
