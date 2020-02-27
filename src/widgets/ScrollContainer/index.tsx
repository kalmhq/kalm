import React from "react";
import PerfectScrollbar from "perfect-scrollbar";
import { withStyles, Theme, WithStyles, createStyles } from "@material-ui/core";

const styles = (theme: Theme) =>
  createStyles({
    scrollContainer: {
      height: "100%",
      position: "relative"
    }
  });

interface ContainerProps {
  children: React.ReactNode;
}

interface Props extends WithStyles<typeof styles>, ContainerProps {}

class ScrollContainer extends React.PureComponent<Props> {
  private ps?: PerfectScrollbar | null;

  public render() {
    const { children, classes } = this.props;

    return (
      <div
        className={classes.scrollContainer}
        ref={ref => {
          if (ref && !this.ps) {
            this.ps = new PerfectScrollbar(ref, {
              suppressScrollX: true
            });
          }
        }}>
        {children}
      </div>
    );
  }

  public componentWillUnmount() {
    if (this.ps) {
      this.ps.destroy();
      this.ps = null;
    }
  }
}

export default withStyles(styles)(ScrollContainer);
