import React from "react";
import PerfectScrollbar from "perfect-scrollbar";
import { createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import clsx from "clsx";

const styles = (theme: Theme) =>
  createStyles({
    scrollContainer: {
      height: "100%",
      position: "relative",
      background: "#fff",
    },
  });

interface ContainerProps {
  children: React.ReactNode;
}

interface Props extends WithStyles<typeof styles>, ContainerProps, React.RefAttributes<any> {
  options?: PerfectScrollbar.Options;
  component?: React.ElementType<React.HTMLAttributes<HTMLElement> & React.Props<any>>;
  className?: string;
}

class ScrollContainer extends React.PureComponent<Props> {
  private ps?: PerfectScrollbar | null;

  public updatePS = () => {
    // console.log(this.ps);
    if (!this.ps) return;
    this.ps.update();
  };

  public render() {
    const { children, classes, options, component, className } = this.props;
    return React.createElement(component || "div", {
      ref: (ref) => {
        if (ref && !this.ps) {
          this.ps = new PerfectScrollbar(ref, {
            suppressScrollX: true,
            ...options,
          });
        }
      },
      children,
      className: clsx(classes.scrollContainer, className),
    });
  }

  public componentWillUnmount() {
    if (this.ps) {
      this.ps.destroy();
      this.ps = null;
    }
  }
}

export default withStyles(styles)(ScrollContainer);
