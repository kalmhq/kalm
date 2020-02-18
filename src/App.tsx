import AppBar from "@material-ui/core/AppBar";
import CssBaseline from "@material-ui/core/CssBaseline";
import Drawer from "@material-ui/core/Drawer";
import Icon from "@material-ui/core/Icon";
import IconButton from "@material-ui/core/IconButton";
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme
} from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import MenuIcon from "@material-ui/icons/Menu";
import clsx from "clsx";
import React from "react";
import { Route, Switch } from "react-router-dom";
import ApplicationEdit from "./pages/ApplicationEdit";
import ApplictionList from "./pages/ApplicationList";
import ApplicationNew from "./pages/ApplicationNew";
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
        text: "Component",
        to: "/components",
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
      {
        text: "Install",
        to: "/install",
        type: "normal",
        icon: "settings"
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
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      })
    },
    appBarShift: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(["width", "margin"], {
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

export default function MiniDrawer() {
  const theme = useTheme();
  const classes = useStyles(theme);
  const [open, setOpen] = React.useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
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
            })}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                className={clsx(classes.menuButton, {
                  [classes.hide]: open
                })}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap>
                **
              </Typography>
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
            PaperProps={{ className: classes.paper }}
          >
            <div className={classes.toolbar}>
              <div className={classes.toolbarTitle}>
                <img
                  src="http://via.placeholder.com/24x24"
                  className={classes.toolbarTitleImg}
                  alt="logo"
                />
                Kapp Dashboard
              </div>

              <IconButton onClick={handleDrawerClose} color="inherit">
                <Icon color="inherit">chevron_left_icon</Icon>
              </IconButton>
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
                <ApplictionList />
              </Route>
              <Route
                exact
                path="/applications/:applicationId/edit"
                component={ApplicationEdit}
              ></Route>
              <Route exact path="/applications/new">
                <ApplicationNew />
              </Route>
              <Route exact path="/components/new">
                <ComponentTemplateNew />
              </Route>
              <Route
                exact
                path="/components/:componentId/edit"
                component={ComponentTemplateEdit}
              ></Route>
              <Route
                exact
                path="/components"
                component={ComponentTemplateList}
              ></Route>
              <Route exact path="/configs" component={ConfigList}></Route>
              <Route exact path="/cluster/nodes" component={NodeList}></Route>
              <Route exact path="/cluster/disks" component={Disks}></Route>

              <Route component={NoMatch} />
            </Switch>
          </main>
        </div>
      </Route>
    </Switch>
  );
}
