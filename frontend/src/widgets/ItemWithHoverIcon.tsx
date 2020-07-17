import React from "react";
import { withStyles, createStyles, Theme, WithStyles } from "@material-ui/core";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    icon: {
      transition: "opacity 0.5s",
    },
  });

interface Props extends WithStyles<typeof styles> {
  icon?: any;
}

interface State {
  displayIcon: boolean;
}

class ItemWithHoverIconRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      displayIcon: false,
    };
  }

  render() {
    const { children, icon, classes } = this.props;
    return (
      <span
        onMouseEnter={() => this.setState({ displayIcon: true })}
        onMouseLeave={() => this.setState({ displayIcon: false })}
      >
        {children}
        {icon && (
          <span className={classes.icon} style={{ opacity: this.state.displayIcon ? "1" : "0" }}>
            {icon}
          </span>
        )}
      </span>
    );
  }
}

export const ItemWithHoverIcon = withStyles(styles)(ItemWithHoverIconRaw);
