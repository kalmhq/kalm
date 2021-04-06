import { Box, createStyles, Paper, Theme, withStyles, WithStyles } from "@material-ui/core";
import { blinkTopProgressAction } from "actions/settings";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import { TDispatchProp } from "types";
import { H1, H5 } from "./Label";
import { KLink } from "./Link";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  text?: string;
  redirect?: string;
  redirectText?: string;
}

interface State {}

class ResourceNotFoundRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { text, redirect, redirectText } = this.props;
    return (
      <Paper variant="outlined">
        <Box p={2}>
          <Box p={2} display="flex" justifyContent="center">
            <H1>404</H1>
          </Box>
          <Box p={2} display="flex" justifyContent="center">
            <H5>{text || "Resource not found"}</H5>
          </Box>
          <Box p={2} display="flex" justifyContent="center">
            <KLink to={redirect || "/"} onClick={() => blinkTopProgressAction()}>
              {redirectText || "Go back to dashboard"}
            </KLink>
          </Box>
        </Box>
      </Paper>
    );
  }
}

export const ResourceNotFound = withStyles(styles)(connect(mapStateToProps)(ResourceNotFoundRaw));
