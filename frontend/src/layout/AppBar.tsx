import { AppBar, createStyles, Divider, IconButton, Menu, MenuItem, Theme } from "@material-ui/core";
import AccountCircle from "@material-ui/icons/AccountCircle";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import MenuIcon from "@material-ui/icons/Menu";
import { WithStyles, withStyles } from "@material-ui/styles";
import { logoutAction } from "actions/auth";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { FlexRowItemCenterBox } from "widgets/Box";
import { loadApplicationsAction } from "../actions/application";
import { setSettingsAction } from "../actions/settings";

export const APP_BAR_HEIGHT = 48;

const mapStateToProps = (state: RootState) => {
  const activeNamespace = state.get("namespaces").get("active");

  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  return {
    isOpenRootDrawer: state.get("settings").get("isOpenRootDrawer"),
    activeNamespace,
    isAdmin,
    entity
  };
};

const styles = (theme: Theme) =>
  createStyles({
    appBar: {
      color: "white",
      backgroundColor: theme.palette.primary.main,
      position: "fixed",
      top: "0px",
      transition: "0.2s",
      height: APP_BAR_HEIGHT,
      zIndex: 1202
    },
    barContainer: {
      height: "100%",
      width: "100%",
      margin: "0 auto",
      position: "relative",
      // padding: "0 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    barLeft: {
      display: "flex",
      alignItems: "center"
    },
    shrinkButton: {
      // margin: `0 10px`
    },
    barTitle: {
      color: "inherit",
      fontSize: "18px",
      fontWeight: "normal",
      padding: "10px 0",
      "&:hover": {
        color: "inherit"
      }
    },
    barRight: {
      display: "flex",
      alignItems: "center",
      "& > *": {
        marginLeft: "2px"
      }
    },
    barAvatar: {
      cursor: "pointer"
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
  title: string;
}

interface State {
  authMenuAnchorElement: null | HTMLElement;
}

class AppBarComponentRaw extends React.PureComponent<Props, State> {
  private headerRef = React.createRef<React.ReactElement>();

  constructor(props: Props) {
    super(props);

    this.state = {
      authMenuAnchorElement: null
    };
  }

  public componentDidMount() {
    this.props.dispatch(loadApplicationsAction());
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
          color="inherit">
          <AccountCircle />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={authMenuAnchorElement}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          open={Boolean(authMenuAnchorElement)}
          onClose={() => {
            this.setState({ authMenuAnchorElement: null });
          }}>
          <MenuItem disabled>Auth as {entity}</MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              this.props.dispatch(logoutAction());
            }}>
            Logout
          </MenuItem>
        </Menu>
      </div>
    );
  }

  render() {
    const { classes, title, dispatch, isOpenRootDrawer } = this.props;

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
              <Link className={classes.barTitle} to="/">
                {title}
              </Link>
            </FlexRowItemCenterBox>
          </div>

          <div className={classes.barRight}>
            {/* <IconButtonWithTooltip tooltipTitle="Settings" style={{ color: "#fff" }} component={NavLink} to={"/roles"}>
              <SettingsIcon />
            </IconButtonWithTooltip> */}
            <Divider orientation="vertical" flexItem color="inherit" />
            <div className={classes.barAvatar}>{this.renderAuthEntity()}</div>
          </div>
        </div>
      </AppBar>
    );
  }
}

export const AppBarComponent = connect(mapStateToProps)(withStyles(styles)(AppBarComponentRaw));
