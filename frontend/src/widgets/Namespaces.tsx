import {
  Button,
  ClickAwayListener,
  createStyles,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Theme,
  withStyles,
  WithStyles
} from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { loadNamespaces } from "actions/namespaces";
import { RootState } from "reducers";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      zIndex: 10
    }
  });

const mapStateToProps = (state: RootState) => {
  return {
    namespaces: state.get("namespaces").get("namespaces")
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {
  open: boolean;
}

class NamespacesRaw extends React.PureComponent<Props, State> {
  private anchorRef = React.createRef<HTMLButtonElement>();

  constructor(props: Props) {
    super(props);
    this.state = {
      open: false
    };
  }

  private handleToggle = () => {
    this.setState({
      open: !this.state.open
    });
  };

  private handleClose = () => {
    this.setState({
      open: false
    });
  };

  private handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      this.handleClose();
    }
  };

  componentDidMount() {
    this.props.dispatch(loadNamespaces());
  }

  public render() {
    const { classes, namespaces } = this.props;
    const { open } = this.state;
    return (
      <div className={classes.root}>
        <Button
          ref={this.anchorRef}
          aria-controls={open ? "menu-list-grow" : undefined}
          aria-haspopup="true"
          color="default"
          onClick={this.handleToggle}>
          Select Namespace
        </Button>
        <Popper open={open} anchorEl={this.anchorRef.current} role={undefined} transition disablePortal>
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{ transformOrigin: placement === "bottom" ? "center top" : "center bottom" }}>
              <Paper>
                <ClickAwayListener onClickAway={this.handleClose}>
                  <MenuList autoFocusItem={open} id="menu-list-grow" onKeyDown={this.handleListKeyDown}>
                    {namespaces
                      .map(ns => (
                        <MenuItem onClick={this.handleClose} key={ns.get("name")}>
                          {ns.get("name")}
                        </MenuItem>
                      ))
                      .toArray()}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    );
  }
}

export const Namespaces = withStyles(styles)(connect(mapStateToProps)(NamespacesRaw));
