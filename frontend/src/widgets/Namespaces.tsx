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
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import { withNamespace, WithNamespaceProps } from "hoc/withNamespace";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";
import { LEFT_SECTION_OPEN_WIDTH, NAMESPACES_ZINDEX, SECOND_HEADER_HEIGHT } from "layout/Constants";
import React from "react";
import { Link, withRouter } from "react-router-dom";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      zIndex: NAMESPACES_ZINDEX,
    },
    namespaceButton: {
      height: SECOND_HEADER_HEIGHT,
      width: "100%",
      justifyContent: "space-between",
      paddingLeft: 24,
      paddingTop: 16,
      textTransform: "lowercase",
      border: 0,
      borderRadius: 0,
      color: theme.palette.type === "light" ? "#000" : "inherit",
      fontSize: theme.typography.subtitle1.fontSize,
    },
    menuList: {
      width: LEFT_SECTION_OPEN_WIDTH,
    },
    menuItem: {
      paddingLeft: 24,
    },
  });

interface Props extends WithStyles<typeof styles>, WithUserAuthProps, WithNamespaceProps {}

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

  public render() {
    const {
      classes,
      applications,
      activeNamespace,
      isNamespaceLoading,
      isNamespaceFirstLoaded,
      location,
      canViewNamespace,
      canEditNamespace,
    } = this.props;
    const { open } = this.state;

    if (isNamespaceLoading && !isNamespaceFirstLoaded) {
      return (
        <div className={classes.root}>
          <Button className={classes.namespaceButton}>Loading...</Button>
        </div>
      );
    }

    const pathnameSplits = location.pathname.split("/");

    const filteredApp = applications.filter((app) => {
      return canEditNamespace(app.name) || canViewNamespace(app.name);
    });

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
            ? activeNamespace.name
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
              <Paper variant="outlined">
                <ClickAwayListener onClickAway={this.handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="menu-list-grow"
                    onKeyDown={this.handleListKeyDown}
                    classes={{ root: classes.menuList }}
                  >
                    {filteredApp.map((application) => {
                      const name = application.name;
                      let to = `/applications/${application.name}/components`;
                      if (pathnameSplits[1] && pathnameSplits[2] && pathnameSplits[1] === "applications") {
                        pathnameSplits[2] = application.name;
                        to = pathnameSplits.slice(0, 4).join("/");
                      }
                      return (
                        <MenuItem
                          onClick={this.handleClose}
                          namespace-name={application.name}
                          key={application.name}
                          className={classes.menuItem}
                          component={Link}
                          to={to}
                        >
                          {name}
                        </MenuItem>
                      );
                    })}
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

export const Namespaces = withUserAuth(withNamespace(withStyles(styles)(withRouter(NamespacesRaw))));
