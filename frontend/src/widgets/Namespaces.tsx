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
  WithStyles,
} from "@material-ui/core";
import React from "react";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import { SECOND_HEADER_HEIGHT } from "layout/SecondHeader";
import { LEFT_SECTION_OPEN_WIDTH } from "pages/BasePage";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { setCurrentNamespaceAction } from "actions/namespaces";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      zIndex: 10,
    },
    namespaceButton: {
      height: SECOND_HEADER_HEIGHT,
      width: "100%",
      justifyContent: "space-between",
      paddingLeft: 32,
      border: 0,
      borderRadius: 0,
    },
    menuList: {
      width: LEFT_SECTION_OPEN_WIDTH,
    },
  });

interface Props extends WithStyles<typeof styles>, WithNamespaceProps {}

interface State {
  open: boolean;
}

class NamespacesRaw extends React.PureComponent<Props, State> {
  private anchorRef = React.createRef<HTMLButtonElement>();

  constructor(props: Props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  private handleToggle = () => {
    this.setState({
      open: !this.state.open,
    });
  };

  private handleClose = () => {
    this.setState({
      open: false,
    });
  };

  private handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      this.handleClose();
    }
  };

  private handleSelect = (event: React.MouseEvent) => {
    const { dispatch } = this.props;
    dispatch(setCurrentNamespaceAction(event.currentTarget.getAttribute("namespace-name")!));
    this.handleClose();
  };

  public render() {
    const { classes, applications, activeNamespace, isNamespaceLoading, isNamespaceFirstLoaded } = this.props;
    const { open } = this.state;

    if (isNamespaceLoading && !isNamespaceFirstLoaded) {
      return (
        <div className={classes.root}>
          <Button className={classes.namespaceButton}>Loading...</Button>
        </div>
      );
    }

    return (
      <div className={classes.root}>
        <Button
          ref={this.anchorRef}
          aria-controls={open ? "menu-list-grow" : undefined}
          aria-haspopup="true"
          className={classes.namespaceButton}
          onClick={this.handleToggle}
        >
          {isNamespaceLoading && !isNamespaceFirstLoaded
            ? "Loading..."
            : activeNamespace
            ? activeNamespace.get("name")
            : "Select a Application"}
          {open ? <ExpandLess /> : <ExpandMore />}
        </Button>

        <Popper
          open={open}
          anchorEl={this.anchorRef.current}
          role={undefined}
          placement="bottom-start"
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{ transformOrigin: placement === "bottom" ? "center top" : "center bottom" }}
            >
              <Paper>
                <ClickAwayListener onClickAway={this.handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="menu-list-grow"
                    onKeyDown={this.handleListKeyDown}
                    classes={{ root: classes.menuList }}
                  >
                    {applications
                      .map((application) => (
                        <MenuItem
                          onClick={this.handleSelect}
                          namespace-name={application.get("name")}
                          key={application.get("name")}
                        >
                          {application.get("name")}
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

export const Namespaces = withNamespace(withStyles(styles)(NamespacesRaw));
