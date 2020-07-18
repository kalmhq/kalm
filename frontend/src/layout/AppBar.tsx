import { AppBar, Breadcrumbs, createStyles, Divider, IconButton, Menu, MenuItem, Theme } from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import MenuIcon from "@material-ui/icons/Menu";
import { WithStyles, withStyles } from "@material-ui/styles";
import { logoutAction } from "actions/auth";
import { closeTutorialDrawerAction, openTutorialDrawerAction } from "actions/tutorial";
import React from "react";
import { connect } from "react-redux";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { FlexRowItemCenterBox } from "widgets/Box";
import { blinkTopProgressAction, setSettingsAction } from "actions/settings";
import { APP_BAR_HEIGHT, APP_BAR_ZINDEX } from "./Constants";
import { HelpIcon, KalmUserIcon } from "widgets/Icon";

const mapStateToProps = (state: RootState) => {
  const activeNamespace = state.get("namespaces").get("active");

  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  return {
    isOpenRootDrawer: state.get("settings").get("isOpenRootDrawer"),
    tutorialDrawerOpen: state.get("tutorial").get("drawerOpen"),
    activeNamespace,
    isAdmin,
    entity,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    appBar: {
      color: "white",
      backgroundColor: theme.palette.primary.main,
      position: "fixed",
      top: 0,
      transition: theme.transitions.create("all", {
        duration: theme.transitions.duration.short,
      }),
      height: APP_BAR_HEIGHT,
      zIndex: APP_BAR_ZINDEX,
    },
    barContainer: {
      height: "100%",
      width: "100%",
      margin: "0 auto",
      position: "relative",
      // padding: "0 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    barLeft: {
      display: "flex",
      alignItems: "center",
    },
    shrinkButton: {
      // margin: `0 10px`
    },
    barTitle: {
      color: theme.palette.primary.light,
      fontSize: "18px",
      fontWeight: "normal",
      padding: "0 0",
      paddingLeft: 5,
      paddingRight: 5,
      borderBottom: "2px solid transparent",
      "&.disabled": {
        color: "#FFF",
        cursor: "unset",
      },
      "&.disabled:hover": {
        color: "#FFF",
        backgroundColor: "unset",
        fontWeight: "unset",
        borderBottom: "2px solid transparent",
      },
      "&:hover": {
        color: "white",
        // fontWeight: "bold",
        borderBottom: "2px solid white",
      },
    },
    barRight: {
      display: "flex",
      alignItems: "center",
      "& > *": {
        marginLeft: "2px",
      },
    },
    barAvatar: {
      cursor: "pointer",
    },
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, RouteComponentProps {
  dispatch: TDispatch;
}

interface State {
  authMenuAnchorElement: null | HTMLElement;
}

class AppBarComponentRaw extends React.PureComponent<Props, State> {
  private headerRef = React.createRef<React.ReactElement>();

  constructor(props: Props) {
    super(props);

    this.state = {
      authMenuAnchorElement: null,
    };
  }

  renderAuthEntity() {
    const { entity } = this.props;
    const { authMenuAnchorElement } = this.state;
    return (
      <div>
        <IconButton
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            this.setState({ authMenuAnchorElement: event.currentTarget });
          }}
          color="inherit"
        >
          <KalmUserIcon />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={authMenuAnchorElement}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={Boolean(authMenuAnchorElement)}
          onClose={() => {
            this.setState({ authMenuAnchorElement: null });
          }}
        >
          <MenuItem disabled>Auth as {entity}</MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              this.props.dispatch(logoutAction());
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </div>
    );
  }

  renderTutorialIcon = () => {
    const { tutorialDrawerOpen, dispatch } = this.props;
    return (
      <IconButton
        aria-label="Switch Tutorial"
        aria-haspopup="true"
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          tutorialDrawerOpen ? dispatch(closeTutorialDrawerAction()) : dispatch(openTutorialDrawerAction());
        }}
        color="inherit"
      >
        <HelpIcon style={{ fill: "white" }} />
      </IconButton>
    );
  };

  private renderBreadcrumbContent = (path: string) => {
    switch (path) {
      case "applications":
      case "":
        return "Applications";
      default:
        return path[0].toUpperCase() + path.slice(1);
    }
  };

  render() {
    const { classes, dispatch, isOpenRootDrawer, location } = this.props;
    const pathArray = location.pathname.split("/");
    return (
      <AppBar ref={this.headerRef} id="header" position="relative" className={classes.appBar}>
        <div className={classes.barContainer}>
          <div className={classes.barLeft}>
            <IconButton
              className={classes.shrinkButton}
              onClick={() => dispatch(setSettingsAction({ isOpenRootDrawer: !isOpenRootDrawer }))}
              // size={"small"}
            >
              {isOpenRootDrawer ? <ChevronLeftIcon htmlColor={"#fff"} /> : <MenuIcon htmlColor={"#fff"} />}
            </IconButton>
            <FlexRowItemCenterBox>
              <Breadcrumbs aria-label="breadcrumb">
                {pathArray.map((path, index) => {
                  if (path === "cluster") {
                    return null;
                  } else if (index === 0) {
                    return (
                      <Link key={index} className={classes.barTitle} to="/" onClick={() => blinkTopProgressAction()}>
                        Kalm Dashboard
                      </Link>
                    );
                  } else if (index + 1 === pathArray.length) {
                    return (
                      <span key={index} className={`${classes.barTitle} disabled`}>
                        {this.renderBreadcrumbContent(path)}
                      </span>
                    );
                  } else {
                    return (
                      <Link
                        key={index}
                        className={classes.barTitle}
                        to={pathArray.slice(0, index + 1).join("/")}
                        onClick={() => blinkTopProgressAction()}
                      >
                        {this.renderBreadcrumbContent(path)}
                      </Link>
                    );
                  }
                })}
              </Breadcrumbs>
            </FlexRowItemCenterBox>
          </div>

          <div className={classes.barRight}>
            {/* <IconButtonWithTooltip tooltipTitle="Settings" style={{ color: "#fff" }} component={NavLink} to={"/roles"}>
              <SettingsIcon />
            </IconButtonWithTooltip> */}
            <Divider orientation="vertical" flexItem color="inherit" />
            <div className={classes.barAvatar}>{this.renderTutorialIcon()}</div>
            <Divider orientation="vertical" flexItem color="inherit" />
            <div className={classes.barAvatar}>{this.renderAuthEntity()}</div>
          </div>
        </div>
      </AppBar>
    );
  }
}

export const AppBarComponent = connect(mapStateToProps)(withStyles(styles)(withRouter(AppBarComponentRaw)));
