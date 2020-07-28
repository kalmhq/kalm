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
import { primaryBackgroud, primaryColor } from "theme/theme";
import {
  KalmApplicationIcon,
  KalmCertificatesIcon,
  KalmIngressIcon,
  KalmNodeIcon,
  KalmRegistryIcon,
  KalmVolumeIcon,
  SettingIcon,
} from "widgets/Icon";
import { blinkTopProgressAction } from "actions/settings";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  return {
    pathname: window.location.pathname,
    isOpenRootDrawer: state.get("settings").get("isOpenRootDrawer"),
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
    entity,
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
      backgroundColor: `${primaryBackgroud} !important`,
      borderLeft: `4px solid ${primaryColor}`,
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

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
}

interface State {}

const sideBarData = [
  {
    name: "Application",
    items: [
      { icon: KalmApplicationIcon, text: "Apps", to: "/applications" },
      {
        icon: KalmCertificatesIcon,
        text: "Certificates",
        to: "/certificates",
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
        icon: KalmIngressIcon,
        text: "Load Balancer",
        to: "/cluster/loadbalancer",
      },
      {
        icon: KalmVolumeIcon,
        text: "Disks",
        to: "/cluster/disks",
      },
      {
        icon: KalmRegistryIcon,
        text: "Registries",
        to: "/cluster/registries",
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
    ],
  },
];

class RootDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
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
          {sideBarData.map((group) => {
            return (
              <React.Fragment key={group.name}>
                {open ? (
                  <ListSubheader disableSticky={true} className={classes.listSubHeader}>
                    {group.name}
                  </ListSubheader>
                ) : null}

                {group.items!.map((item) => {
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

export const RootDrawer = connect(mapStateToProps)(withStyles(styles)(RootDrawerRaw));
