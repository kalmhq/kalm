import {
  createStyles,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Theme,
} from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import { blinkTopProgressAction, setSettingsAction } from "actions/settings";
import clsx from "clsx";
import { APP_BAR_HEIGHT, LEFT_SECTION_CLOSE_WIDTH, LEFT_SECTION_OPEN_WIDTH } from "layout/Constants";
import React from "react";
import { connect } from "react-redux";
import { NavLink } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import {
  CIIcon,
  InfoIcon,
  KalmApplicationIcon,
  KalmCertificatesIcon,
  KalmNodeIcon,
  KalmRegistryIcon,
  KalmRoutesIcon,
  KalmVolumeIcon,
  MenuIcon,
  MenuOpenIcon,
  PeopleIcon,
  SettingIcon,
} from "widgets/Icon";

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
        theme.palette.type === "light" ? theme.palette.primary.main : theme.palette.primary.light
      }`,
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: theme.palette.type === "light" ? "#000" : "inherit",
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
      position: "relative",
    },
    drawerPaper: {
      width: LEFT_SECTION_OPEN_WIDTH,
      paddingTop: APP_BAR_HEIGHT,
    },
    drawerPaperClose: {
      width: LEFT_SECTION_OPEN_WIDTH,
      paddingTop: APP_BAR_HEIGHT + 48,
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
      borderBottom: `1px solid ${theme.palette.divider}`,
      height: 48,
      paddingLeft: 12,
    },
    shrinkButton: {
      position: "absolute",
      zIndex: 1,
      right: 8,
      top: APP_BAR_HEIGHT + 8,
    },
    shrinkButtonClose: {
      position: "absolute",
      zIndex: 1,
      right: 0,
      top: APP_BAR_HEIGHT,
    },
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
}

const RootDrawerRaw: React.FC<Props> = (props) => {
  const getSideBarData = () => {
    return [
      {
        name: "Application",
        items: [
          { icon: KalmApplicationIcon, text: "Apps", to: "/applications" },
          {
            icon: KalmCertificatesIcon,
            text: "Domains & Certs",
            to: "/domains",
          },
          {
            text: "Routes",
            to: "/routes",
            icon: KalmRoutesIcon,
          },
          {
            icon: CIIcon,
            text: "Webhooks",
            to: "/webhooks",
          },
        ],
      },
      {
        name: "Cluster",
        items: [
          {
            icon: KalmNodeIcon,
            text: "Nodes",
            to: "/cluster/nodes",
          },

          {
            icon: KalmVolumeIcon,
            text: "Disks",
            to: "/cluster/disks",
          },
          {
            icon: KalmRegistryIcon,
            text: "Pull Secrets",
            to: "/cluster/pull-secrets",
          },
        ],
      },
      {
        name: "Settings",
        items: [
          {
            icon: SettingIcon,
            text: "Single Sign-on",
            to: "/sso",
          },
          {
            icon: PeopleIcon,
            text: "Members",
            to: "/members",
          },
          {
            icon: InfoIcon,
            text: "Version",
            to: "/version",
          },
        ],
      },
    ];
  };

  const { classes, pathname, isOpenRootDrawer: open, dispatch } = props;
  return (
    <Drawer
      variant="permanent"
      className={clsx(classes.drawer, {
        [classes.drawerOpen]: open,
        [classes.drawerClose]: !open,
      })}
      classes={{
        paper: clsx(open ? classes.drawerPaper : classes.drawerPaperClose, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        }),
      }}
    >
      <IconButton
        className={open ? classes.shrinkButton : classes.shrinkButtonClose}
        onClick={() => dispatch(setSettingsAction({ isOpenRootDrawer: !open }))}
        // size={"small"}
      >
        {open ? <MenuOpenIcon /> : <MenuIcon />}
      </IconButton>
      <List style={{ paddingTop: open ? 8 : 0 }}>
        {getSideBarData().map((group) => {
          if (!group) {
            return null;
          }

          if (group.items.filter((x) => !!x).length === 0) {
            return null;
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
};

export const RootDrawer = connect(mapStateToProps)(withStyles(styles)(RootDrawerRaw));
