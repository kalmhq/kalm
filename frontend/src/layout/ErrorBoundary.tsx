import { Box, createStyles, Link, Theme, Typography, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import { TDispatchProp } from "types";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
    },
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {
  hasError: boolean;
}

class ErrorBoundaryRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {}

  private jumpToDashBoard = (event: React.MouseEvent) => {
    event.preventDefault();
    window.location.href = "/";
  };

  render() {
    const { classes } = this.props;

    if (this.state.hasError) {
      return (
        <div className={classes.root}>
          <Typography variant="h2">Something went wrong.</Typography>
          <Box pt={2}>
            <Link href="" onClick={this.jumpToDashBoard}>
              Go back to dashboard
            </Link>
          </Box>
        </div>
      );
    }
    return this.props.children;
  }
}

// https://reactjs.org/docs/error-boundaries.html
export const ErrorBoundary = withStyles(styles)(connect(mapStateToProps)(ErrorBoundaryRaw));
