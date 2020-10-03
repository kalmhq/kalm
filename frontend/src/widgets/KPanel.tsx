import React from "react";
import { Box, createStyles, Paper, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { Body } from "./Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    borderBottom: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      height: "40px",
      padding: `0 ${theme.spacing(2)}px`,
      display: "flex",
      alignItems: "center",
    },
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

// const PANEL_DEFAULT_MAX_WITDTH = 800;

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  title?: string;
  content?: React.ReactNode;
  maxWidth?: number | string;
}

interface State {}

class KPanelRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { classes, title, content, children } = this.props;
    return (
      <Paper square variant="outlined">
        {title && (
          <Box p={2} className={classes.borderBottom}>
            <Body>{title}</Body>
          </Box>
        )}
        {content || children}
      </Paper>
    );
  }
}

export const KPanel = withStyles(styles)(connect(mapStateToProps)(KPanelRaw));
