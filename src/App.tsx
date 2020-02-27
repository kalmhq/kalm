import AppBar from "@material-ui/core/AppBar";
import CssBaseline from "@material-ui/core/CssBaseline";
import Drawer from "@material-ui/core/Drawer";
import Icon from "@material-ui/core/Icon";
import IconButton from "@material-ui/core/IconButton";
import { createStyles, makeStyles, Theme, useTheme } from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import MenuIcon from "@material-ui/icons/Menu";
import clsx from "clsx";
import React from "react";
import { Route, Switch } from "react-router-dom";
import { ApplicationEdit } from "./pages/Application/Edit";
import { ApplicationList } from "./pages/Application/List";
import { ApplicationNew } from "./pages/Application/New";
import { ComponentTemplateEdit } from "./pages/ComponentTemplate/Edit";
import { ComponentTemplateList } from "./pages/ComponentTemplate/List";
import { ComponentTemplateNew } from "./pages/ComponentTemplate/New";
import ConfigList from "./pages/ConfigList";
import Dashboard from "./pages/Dashboard";
import { Disks } from "./pages/Disks";
import InstallPage from "./pages/Install";
import { NodeList } from "./pages/NodeList";
import { NoMatch, Page404 } from "./pages/NoMatch";
import { NotificationComponent } from "./widgets/Notification";
import { Sidenav, SidenavGroupProps } from "./widgets/Sidenav";
import { Fade, Box } from "@material-ui/core";
import { HelperSwitch } from "./widgets/Helper";
import { DependencyList } from "./pages/Dependency/List";

const sidenavGroups: SidenavGroupProps[] = [
  {
    text: "Application",
    items: [
      {
        text: "Application",
        to: "/applications",
        icon: "apps",
        type: "normal"
      },
      {
        text: "Component Template",
        to: "/componenttemplates",
        icon: "extension",
        type: "normal"
      },
      {
        text: "Configs",
        to: "/configs",
        icon: "insert_drive_file",
        type: "normal"
      },
      {
        text: "Routes",
        to: "/routes",
        icon: "call_split",
        type: "normal"
      }
    ]
  },
  {
    text: "Cluster",
    items: [
      {
        text: "Nodes",
        to: "/cluster/nodes",
        type: "normal",
        icon: "computer"
      },
      {
        text: "Disks",
        to: "/cluster/disks",
        type: "normal",
        icon: "storage"
      },
      {
        text: "K8s Resources",
        to: "/cluster/k8s",
        type: "normal",
        icon: "settings"
      }
    ]
  },
  {
    text: "Monitoring",
    items: [
      {
        text: "Metrics",
        to: "/monitoring/metrics",
        type: "normal",
        icon: "multiline_chart"
      },
      {
        text: "Alerts",
        to: "/monitoring/alerts",
        type: "normal",
        icon: "report_problem"
      },
      {
        text: "DebugPage",
        to: "/monitoring/metrics",
        type: "normal",
        icon: "settings"
      }
    ]
  },
  {
    text: "Settings",
    items: [
      // {
      //   text: "Install",
      //   to: "/install",
      //   type: "normal",
      //   icon: "settings"
      // },
      {
        text: "Dependencies",
        to: "/settings/dependencies",
        type: "normal",
        icon: "view_comfy"
      }
    ]
  }
];

const drawerWidth = 280;

const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      display: "flex"
    },
    appBar: {
      zIndex: theme.zIndex.drawer,
      paddingLeft: theme.spacing(9),
      transition: theme.transitions.create(["width", "margin", "padding-left"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      })
    },
    appBarShift: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      paddingLeft: 0,
      transition: theme.transitions.create(["width", "margin", "padding-left"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    menuButton: {
      marginRight: 24
    },
    hide: {
      display: "none"
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: "nowrap"
    },
    drawerOpen: {
      width: drawerWidth,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    drawerClose: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      overflowX: "hidden",
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9) + 1
      }
    },
    paper: {
      color: "white",
      backgroundColor: "#2e323d",
      border: 0
    },
    list: {
      paddingTop: 0,
      paddingBottom: 0
    },
    listItemSelected: {
      backgroundColor: "#039be5 !important"
    },
    listItemGutters: {
      [theme.breakpoints.up("sm")]: {
        paddingLeft: 24,
        paddingRight: 24
      }
    },
    listItemIcon: {
      color: "white"
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.spacing(0, 3),
      background: "#1e2129",
      color: "white",
      ...theme.mixins.toolbar
    },
    toolbarTitle: {
      display: "flex",
      alignItems: "center"
    },
    toolbarTitleImg: {
      marginRight: 6
    },
    content: {
      flexGrow: 1,
      paddingTop: theme.spacing(8)
    },
    nested: {
      paddingLeft: theme.spacing(4)
    }
  });
});

const sidebarFoldedKey = "sidebarFoldedKey";

export default function MiniDrawer() {
  const theme = useTheme();
  const classes = useStyles(theme);
  const [open, setOpen] = React.useState(!window.localStorage.getItem(sidebarFoldedKey));

  const handleDrawerOpen = () => {
    setOpen(true);
    window.localStorage.removeItem(sidebarFoldedKey);
  };

  const handleDrawerClose = () => {
    setOpen(false);
    window.localStorage.setItem(sidebarFoldedKey, "t");
  };

  return (
    <Switch>
      <Route path="/404" component={Page404} />
      <Route>
        <div className={classes.root}>
          <NotificationComponent />
          <CssBaseline />
          <AppBar
            position="fixed"
            color="default"
            className={clsx(classes.appBar, {
              [classes.appBarShift]: open
            })}>
            <Toolbar>
              <Box display="flex" justifyContent="space-between" alignItems="center" style={{ width: "100%" }}>
                <div>
                  <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleDrawerOpen}
                    edge="start"
                    className={clsx(classes.menuButton, {
                      [classes.hide]: open
                    })}>
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h6" noWrap display="inline">
                    **
                  </Typography>
                </div>
                <HelperSwitch />
              </Box>
            </Toolbar>
          </AppBar>
          <Drawer
            variant="permanent"
            className={clsx(classes.drawer, {
              [classes.drawerOpen]: open,
              [classes.drawerClose]: !open
            })}
            classes={{
              paper: clsx({
                [classes.drawerOpen]: open,
                [classes.drawerClose]: !open
              })
            }}
            PaperProps={{ className: classes.paper }}>
            <div className={classes.toolbar}>
              <div className={classes.toolbarTitle}>
                <img src={require("./images/placeholder24x24.png")} className={classes.toolbarTitleImg} alt="logo" />

                {open ? "Kapp Dashboard" : null}
              </div>

              <Fade in={open}>
                <IconButton onClick={handleDrawerClose} color="inherit">
                  <Icon color="inherit">chevron_left_icon</Icon>
                </IconButton>
              </Fade>
            </div>
            <Sidenav groups={sidenavGroups} isFolded={!open} />
          </Drawer>
          <main className={classes.content}>
            <Switch>
              <Route exact path="/" component={Dashboard} />
              <Route exact path="/install">
                <InstallPage />
              </Route>
              <Route exact path="/applications">
                <ApplicationList />
              </Route>
              <Route exact path="/applications/:applicationId/edit" component={ApplicationEdit}></Route>
              <Route exact path="/applications/new">
                <ApplicationNew />
              </Route>
              <Route exact path="/componenttemplates/new">
                <ComponentTemplateNew />
              </Route>
              <Route
                exact
                path="/componenttemplates/:componentTemplateId/edit"
                component={ComponentTemplateEdit}></Route>
              <Route exact path="/componenttemplates" component={ComponentTemplateList}></Route>
              <Route exact path="/configs" component={ConfigList}></Route>
              <Route exact path="/cluster/nodes" component={NodeList}></Route>
              <Route exact path="/cluster/disks" component={Disks}></Route>
              <Route exact path="/settings/dependencies" component={DependencyList}></Route>
              <Route component={NoMatch} />
            </Switch>
          </main>
        </div>
      </Route>
    </Switch>
  );
}
