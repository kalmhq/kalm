import {
  createStyles,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Theme
} from "@material-ui/core";
import AssignmentReturnedIcon from "@material-ui/icons/AssignmentReturned";
import VerifiedUser from "@material-ui/icons/VerifiedUser";
import { WithStyles, withStyles } from "@material-ui/styles";
import clsx from "clsx";
import React from "react";
import { connect } from "react-redux";
import { NavLink } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { APP_BAR_HEIGHT, LEFT_SECTION_CLOSE_WIDTH, LEFT_SECTION_OPEN_WIDTH } from "layout/Constants";
import { primaryBackgroud, primaryColor } from "theme/theme";
import { KappApplicationIcon, KappNodeIcon, KappVolumeIcon } from "../widgets/Icon";
import { blinkTopProgressAction } from "../actions/settings";

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
      },
    },
    listItemSeleted: {
      backgroundColor: `${primaryBackgroud} !important`,
      borderRight: `4px solid ${primaryColor}`,
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: "#000000 !important",
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
      height: 60,
    },
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
}

interface State {}

class RootDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  private getMenuDataApplication() {
    return [
      { icon: KappApplicationIcon, text: "Applications", to: "/applications" },
      {
        icon: VerifiedUser,
        text: "Certificates",
        to: "/certificates",
      },
      // {
      //   icon: KappTemplateIcon,
      //   text: "Templates",
      //   to: "/templates"
      // }
    ];
  }

  private getMenuDataCluster() {
    return [
      {
        icon: KappNodeIcon,
        text: "Nodes",
        to: "/cluster/nodes",
      },
      {
        icon: KappVolumeIcon,
        text: "Disks",
        to: "/cluster/disks",
      },
      {
        icon: AssignmentReturnedIcon,
        text: "Registries",
        to: "/cluster/registries",
      },
      // {
      //   icon: SettingsIcon,
      //   text: "Settings",
      //   to: "/roles",
      // },
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
        {/* <div className={clsx(classes.openBtnWrapper, { [classes.itemBorder]: !open })}>
          <IconButton onClick={() => dispatch(setSettingsAction({ isOpenRootDrawer: !open }))} size={"small"}>
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </div> */}

        <List style={{ paddingTop: open ? 8 : 0 }}>
          {open ? (
            <ListSubheader disableSticky={true} className={classes.listSubHeader}>
              Application
            </ListSubheader>
          ) : null}

          {this.getMenuDataApplication().map((item, index) => (
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
              {open ? <ListItemText primary={item.text} /> : null}
            </ListItem>
          ))}

          {open ? (
            <ListSubheader disableSticky={true} className={classes.listSubHeader}>
              Cluster
            </ListSubheader>
          ) : null}

          {this.getMenuDataCluster().map((item, index) => (
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
              selected={pathname.startsWith(item.to.split("?")[0])}
            >
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              {open ? <ListItemText primary={item.text} /> : null}
            </ListItem>
          ))}
        </List>
      </Drawer>
    );
  }
}

export const RootDrawer = connect(mapStateToProps)(withStyles(styles)(RootDrawerRaw));
