import { AppBar, Box, Breadcrumbs, createStyles, Divider, Menu, MenuItem, Theme } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import deepOrange from "@material-ui/core/colors/deepOrange";
import { WithStyles, withStyles } from "@material-ui/styles";
import { logoutAction } from "actions/auth";
import { blinkTopProgressAction } from "actions/settings";
import { closeTutorialDrawerAction, openTutorialDrawerAction } from "actions/tutorial";
import { stopImpersonating } from "api/api";
import { push } from "connected-react-router";
import { withClusterInfo, WithClusterInfoProps } from "hoc/withClusterInfo";
import React from "react";
import { connect } from "react-redux";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "store";
import { ThemeToggle } from "theme/ThemeToggle";
import { TDispatch } from "types";
import { SubjectTypeUser } from "types/member";
import StringConstants from "utils/stringConstants";
import { FlexRowItemCenterBox } from "widgets/Box";
import { HelpIconNew, ImpersonateIcon, KalmIcon, KalmUserIconNew } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { APP_BAR_HEIGHT, APP_BAR_ZINDEX } from "./Constants";

const mapStateToProps = (state: RootState) => {
  const activeNamespace = state.namespaces.active;

  const auth = state.auth;
  const email = auth.email;
  const impersonation = auth.impersonation;
  const impersonationType = auth.impersonationType;
  const usingTheme = state.settings.usingTheme;

  return {
    isOpenRootDrawer: state.settings.isOpenRootDrawer,
    tutorialDrawerOpen: state.tutorial.drawerOpen,
    impersonation,
    impersonationType,
    activeNamespace,
    email,
    usingTheme,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    appBar: {
      color: "black",
      backgroundColor: theme.palette.type === "light" ? "#fff" : theme.palette.background.paper,
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
    breadcrumb: {
      color: theme.palette.type === "light" ? "#000" : "#fff",
    },
    breadLink: {
      color: theme.palette.type === "light" ? "#000" : "#fff",
      fontSize: "18px",
      fontWeight: "normal",
      padding: "0 0",
      paddingLeft: 5,
      paddingRight: 5,
      borderBottom: "2px solid transparent",
      "&.disabled": {
        color: theme.palette.type === "light" ? "#000" : "#fff",
        cursor: "unset",
      },
      "&.disabled:hover": {
        color: theme.palette.type === "light" ? "#000" : "#fff",
        backgroundColor: "unset",
        fontWeight: "unset",
        borderBottom: "2px solid transparent",
      },
      "&:hover": {
        color: theme.palette.type === "light" ? "#000" : "#fff",
        borderBottom: "2px solid #000",
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

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    RouteComponentProps,
    WithClusterInfoProps {
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

  renderAuth() {
    const { impersonation, impersonationType, email, dispatch, usingTheme } = this.props;
    const { authMenuAnchorElement } = this.state;

    let emailForDisplay: string = email;

    if (email.length > 15) {
      emailForDisplay = email.slice(0, 15) + "...";
    }

    return (
      <div>
        <IconButtonWithTooltip
          tooltipTitle={StringConstants.APP_AUTH_TOOLTIPS}
          aria-label={StringConstants.APP_AUTH_TOOLTIPS}
          aria-haspopup="true"
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            this.setState({ authMenuAnchorElement: event.currentTarget });
          }}
          color="inherit"
        >
          {!impersonation ? (
            <KalmUserIconNew theme={usingTheme} />
          ) : (
            <ImpersonateIcon style={{ color: deepOrange[400] }} />
          )}
        </IconButtonWithTooltip>
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
          <MenuItem disabled>{emailForDisplay}</MenuItem>
          <MenuItem onClick={() => dispatch(push("/profile"))}>Profile</MenuItem>
          {!!impersonation ? (
            <MenuItem
              onClick={async () => {
                stopImpersonating();
              }}
            >
              {impersonationType === SubjectTypeUser
                ? `Stop impersonating ${impersonation}`
                : `Stop impersonating as member in ${impersonation} group`}
            </MenuItem>
          ) : null}
          {email.indexOf("localhost") < 0 ? (
            <Box>
              <Divider />
              <MenuItem
                onClick={() => {
                  this.props.dispatch(logoutAction());
                }}
              >
                Logout
              </MenuItem>
            </Box>
          ) : null}
        </Menu>
      </div>
    );
  }

  renderThemeIcon = () => {
    return <ThemeToggle />;
  };

  renderTutorialIcon = () => {
    const { tutorialDrawerOpen, dispatch, usingTheme } = this.props;
    return (
      <IconButtonWithTooltip
        tooltipTitle={StringConstants.APP_TUTORIAL_TOOLTIPS}
        aria-label={StringConstants.APP_TUTORIAL_TOOLTIPS}
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          tutorialDrawerOpen ? dispatch(closeTutorialDrawerAction()) : dispatch(openTutorialDrawerAction());
        }}
      >
        <HelpIconNew theme={usingTheme} />
      </IconButtonWithTooltip>
    );
  };

  private renderBreadcrumbContent = (path: string, clusterName: string) => {
    switch (path) {
      case "":
        return !!clusterName ? clusterName : "Kalm";
      case "applications":
        return "Apps";
      case "routes":
        return "Routes";
      case "components":
        return "Components";
      case "certificates":
        return "Certificates";
      case "nodes":
        return "Nodes";
      case "loadbalancer":
        return "Load Balancer";
      case "disks":
        return "Disks";
      case "pull-secrets":
        return "Image Pull Secrets";
      case "new":
        return "New";
      case "upload":
        return "Upload";
      case "edit":
        return "Edit";
      case "sso":
        return "SSO";
      case "acme":
        return "ACME DNS Server";
      case "webhooks":
        return "Webhooks";
      case "metrics":
        return StringConstants.APP_DASHBOARD_PAGE_NAME;
      default:
        return path;
    }
  };

  render() {
    const { classes, location, clusterInfo } = this.props;
    const pathArray = location.pathname.split("/");
    return (
      <AppBar ref={this.headerRef} id="header" position="relative" className={classes.appBar}>
        <div className={classes.barContainer}>
          <div className={classes.barLeft}>
            <Box p={2}>
              <Link to={"/"} onClick={() => blinkTopProgressAction()}>
                <KalmIcon />
              </Link>
            </Box>

            <FlexRowItemCenterBox>
              <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumb}>
                {pathArray.map((path, index) => {
                  if (path === "cluster") {
                    return null;
                  } else if (index + 1 === pathArray.length) {
                    return (
                      <span key={index} className={`${classes.breadLink} disabled`}>
                        {this.renderBreadcrumbContent(path, clusterInfo.clusterName)}
                      </span>
                    );
                  } else {
                    return (
                      <Link
                        key={index}
                        className={classes.breadLink}
                        to={pathArray.slice(0, index + 1).join("/")}
                        onClick={() => blinkTopProgressAction()}
                      >
                        {this.renderBreadcrumbContent(path, clusterInfo.clusterName)}
                      </Link>
                    );
                  }
                })}
              </Breadcrumbs>
            </FlexRowItemCenterBox>
          </div>

          <div className={classes.barRight}>
            {clusterInfo.canBeInitialized && (
              <Box mr={2}>
                <Button to="/setup" component={Link} onClick={console.log} variant="outlined" color="secondary">
                  Finish the setup steps
                </Button>
              </Box>
            )}

            <Box className={classes.barAvatar}>{this.renderThemeIcon()}</Box>
            <div className={classes.barAvatar}>{this.renderTutorialIcon()}</div>
            <div className={classes.barAvatar}>{this.renderAuth()}</div>
          </div>
        </div>
      </AppBar>
    );
  }
}

export const AppBarComponent = connect(mapStateToProps)(
  withStyles(styles)(withClusterInfo(withRouter(AppBarComponentRaw))),
);
