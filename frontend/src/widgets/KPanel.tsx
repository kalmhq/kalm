import React from "react";
import { createStyles, Theme, withStyles, WithStyles, Paper, Box } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { H4 } from "./Label";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    borderBottom: {
      borderBottom: "1px solid rgba(0, 0, 0, 0.12)"
    }
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  title: string;
  content: React.ReactNode;
}

interface State {}

class KPanelRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { classes, title, content } = this.props;
    return (
      <Paper square>
        <Box p={2} className={classes.borderBottom}>
          <H4>{title}</H4>
        </Box>
        {content}
      </Paper>
    );
  }
}

export const KPanel = withStyles(styles)(connect(mapStateToProps)(KPanelRaw));
