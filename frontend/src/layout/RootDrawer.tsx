import {
  createStyles,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Theme,
} from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import clsx from "clsx";
import React from "react";
import { connect } from "react-redux";
import { NavLink } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { APP_BAR_HEIGHT, LEFT_SECTION_CLOSE_WIDTH, LEFT_SECTION_OPEN_WIDTH } from "layout/Constants";
import {
  CIIcon,
  InfoIcon,
  KalmApplicationIcon,
  KalmCertificatesIcon,
  KalmIngressIcon,
  KalmNodeIcon,
  KalmRegistryIcon,
  KalmRoutesIcon,
  KalmVolumeIcon,
  PeopleIcon,
  SettingIcon,
} from "widgets/Icon";
import { blinkTopProgressAction } from "actions/settings";
import { withUserAuth, WithUserAuthProps } from "hoc/withUserAuth";

const mapStateToProps = (state: RootState) => {
  return {
    pathname: window.location.pathname,
    isOpenRootDrawer: state.settings.isOpenRootDrawer,
    activeNamespaceName: state.namespaces.active,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    listItem: {
      color: "#000000 !important",
      height: 40,

      "& > .MuiListItemIcon-root": {
        minWidth: 40,
        marginLeft: -4,
      },
      borderLeft: `4px solid transparent`,
    },
    listItemSeleted: {
      borderLeft: `4px solid ${
        theme.palette.type === "light" ? theme.palette.primary.dark : theme.palette.primary.light
      }`,
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: theme.palette.text.secondary,
      "font-size": theme.typography.subtitle1.fontSize,
    },
    ListItemText: {
      "font-size": theme.typography.subtitle1.fontSize,
      color: theme.palette.text.primary,
    },
    drawer: {
      width: LEFT_SECTION_OPEN_WIDTH,
      flexShrink: 0,
      whiteSpace: "nowrap",
    },
    drawerPaper: {
      width: LEFT_SECTION_OPEN_WIDTH,
      paddingTop: APP_BAR_HEIGHT,
    },

    // material-ui official
    drawerOpen: {
      width: LEFT_SECTION_OPEN_WIDTH,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    drawerClose: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: "hidden",
      width: LEFT_SECTION_CLOSE_WIDTH,
      [theme.breakpoints.up("sm")]: {
        width: LEFT_SECTION_CLOSE_WIDTH,
      },
    },
    itemBorder: {
      borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
      height: 48,
      paddingLeft: 12,
    },
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, WithUserAuthProps {
  dispatch: TDispatch;
}

interface State {}

class RootDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  private getSideBarData() {
    const { activeNamespaceName, canViewCluster, canEditNamespace, canEditCluster, canManageCluster } = this.props;

    return [
      {
        name: "Application",
        items: [
          { icon: KalmApplicationIcon, text: "Apps", to: "/applications" },
          canViewCluster()
            ? {
                icon: KalmCertificatesIcon,
                text: "Certificates",
                to: "/certificates",
              }
            : null,
          {
            text: "Routes",
            to: "/routes",
            icon: KalmRoutesIcon,
          },
          canEditNamespace(activeNamespaceName) || canEditCluster()
            ? {
                icon: CIIcon,
                text: "CI / CD",
                to: "/ci",
              }
            : null,
        ],
      },
      {
        name: "Cluster",
        items: [
          canViewCluster()
            ? {
                icon: KalmNodeIcon,
                text: "Nodes",
                to: "/cluster/nodes",
              }
            : null,
          canViewCluster()
            ? {
                icon: KalmIngressIcon,
                text: "Load Balancer",
                to: "/cluster/loadbalancer",
              }
            : null,
          canViewCluster()
            ? {
                icon: KalmVolumeIcon,
                text: "Disks",
                to: "/cluster/disks",
              }
            : null,
          canEditNamespace(activeNamespaceName) || canViewCluster()
            ? {
                icon: KalmRegistryIcon,
                text: "Registries",
                to: "/cluster/registries",
              }
            : null,
        ],
      },
      {
        name: "Settings",
        items: [
          canViewCluster()
            ? {
                icon: SettingIcon,
                text: "Single Sign-on",
                to: "/sso",
              }
            : null,

          // {
          //   icon: SettingIcon,
          //   text: "System",
          //   to: "/system",
          // },
          canManageCluster()
            ? {
                icon: PeopleIcon,
                text: "Members",
                to: "/cluster/members",
              }
            : null,
          canManageCluster()
            ? {
                icon: InfoIcon,
                text: "Version",
                to: "/version",
              }
            : null,
        ],
      },
    ];
  }

  render() {
    const { classes, pathname, isOpenRootDrawer: open } = this.props;
    return (
      <Drawer
        variant="permanent"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        })}
        classes={{
          paper: clsx(classes.drawerPaper, {
            [classes.drawerOpen]: open,
            [classes.drawerClose]: !open,
          }),
        }}
      >
        <List style={{ paddingTop: open ? 8 : 0 }}>
          {this.getSideBarData().map((group) => {
            if (!group) {
              return null;
            } else {
              let emptyGroup = true;
              group.items.forEach((item) => {
                if (item) {
                  emptyGroup = false;
                }
              });
              if (emptyGroup) {
                return null;
              }
            }
            return (
              <React.Fragment key={group.name}>
                {open ? (
                  <ListSubheader disableSticky={true} className={classes.listSubHeader}>
                    {group.name}
                  </ListSubheader>
                ) : null}

                {group.items!.map((item) => {
                  if (!item) {
                    return null;
                  }
                  return (
                    <ListItem
                      onClick={() => blinkTopProgressAction()}
                      className={clsx(classes.listItem, {
                        [classes.itemBorder]: !open,
                      })}
                      classes={{
                        selected: classes.listItemSeleted,
                      }}
                      button
                      component={NavLink}
                      to={item.to}
                      key={item.text}
                      tutorial-anchor-id={"first-level-sidebar-item-" + item.text.toLocaleLowerCase()}
                      selected={pathname.startsWith(item.to.split("?")[0])}
                    >
                      <ListItemIcon>
                        <item.icon />
                      </ListItemIcon>
                      {open ? <ListItemText classes={{ primary: classes.ListItemText }} primary={item.text} /> : null}
                    </ListItem>
                  );
                })}
              </React.Fragment>
            );
          })}
        </List>
      </Drawer>
    );
  }
}

export const RootDrawer = withUserAuth(connect(mapStateToProps)(withStyles(styles)(RootDrawerRaw)));
