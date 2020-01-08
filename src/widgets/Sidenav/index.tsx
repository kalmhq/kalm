import React from "react";
import clsx from "clsx";
import {
  createStyles,
  makeStyles,
  useTheme,
  Theme
} from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Icon from "@material-ui/core/Icon";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import Collapse from "@material-ui/core/Collapse";
import { NavLink as RouterLink } from "react-router-dom";

const drawerWidth = 280;

// Todo Refactor css
const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      display: "flex",
      flexDirection: "column"
    },
    listSubheader: {
      color: "rgba(255, 255, 255, 0.5)",
      textTransform: "uppercase",
      fontWeight: 600,
      fontSize: 14,
      height: 40,
      lineHeight: "40px"
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
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
      padding: theme.spacing(3)
    },
    nested: {
      paddingLeft: theme.spacing(5)
    },
    groupFolded: {
      [theme.breakpoints.up("sm")]: {
        paddingLeft: "23px"
      }
    }
  });
});

export type SidenavItemType = "normal" | "dropdown";

export interface SidenavItemNormalProps {
  type: "normal";
  text: string;
  to: string;
  icon: string;
  isFolded?: boolean;
  nestedLevel?: number;
}

export interface SidenavItemDropdownProps {
  type: "dropdown";
  isFolded?: boolean;
  text: string;
  icon: string;
  items: SidenavItemNormalProps[];
}

export interface SidenavGroupProps {
  text: string;
  isFolded?: boolean;
  items: (SidenavItemNormalProps | SidenavItemDropdownProps)[];
}

const SidenavGroup: React.FunctionComponent<SidenavGroupProps> = props => {
  const theme = useTheme();
  const classes = useStyles(theme);
  return (
    <List
      className={clsx(classes.list)}
      subheader={
        <ListSubheader
          component="div"
          className={clsx(classes.listSubheader, {
            [classes.groupFolded]: props.isFolded
          })}
        >
          {props.isFolded ? (
            <Icon style={{ verticalAlign: "middle" }}>remove</Icon>
          ) : (
            props.text
          )}
        </ListSubheader>
      }
    >
      {props.items.map((item, index) =>
        item.type === "normal" ? (
          <SidenavItemNormal {...item} isFolded={props.isFolded} />
        ) : (
          <SidenavItemDropdown {...item} isFolded={props.isFolded} />
        )
      )}
    </List>
  );
};

const SidenavItemNormal: React.FunctionComponent<SidenavItemNormalProps> = props => {
  const theme = useTheme();
  const classes = useStyles(theme);
  return (
    <ListItem
      button
      component={RouterLink}
      to={props.to}
      exact
      activeClassName={classes.listItemSelected}
      className={clsx({
        [classes.nested]: props.nestedLevel
      })}
      classes={{
        gutters: classes.listItemGutters,
        selected: classes.listItemSelected
      }}
    >
      <ListItemIcon className={classes.listItemIcon}>
        <Icon color="inherit">{props.icon}</Icon>
      </ListItemIcon>
      <ListItemText primary={props.text} />
    </ListItem>
  );
};

const SidenavItemDropdown: React.FunctionComponent<SidenavItemDropdownProps> = props => {
  const useStyles = makeStyles((theme: Theme) => {
    return {
      listItemGutters: {
        [theme.breakpoints.up("sm")]: {
          paddingLeft: 24,
          paddingRight: 24
        }
      },
      listItemIcon: {
        color: "white"
      },
      open: {
        backgroundColor: "#282c36",
        "&:hover": {
          backgroundColor: "#282c36"
        }
      }
    };
  });

  const theme = useTheme();
  const classes = useStyles(theme);
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <>
      <ListItem
        button
        onClick={handleClick}
        classes={{
          gutters: classes.listItemGutters
        }}
        className={clsx({ [classes.open]: open })}
      >
        <ListItemIcon className={classes.listItemIcon}>
          <Icon color="inherit">{props.icon}</Icon>
        </ListItemIcon>
        <ListItemText primary={props.text} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      {props.isFolded ? null : (
        <Collapse
          in={open}
          timeout="auto"
          unmountOnExit
          className={clsx({ [classes.open]: open })}
        >
          <List component="div" disablePadding>
            {props.items.map(item => (
              <SidenavItemNormal {...item} nestedLevel={1} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export interface SidenavProps {
  groups: SidenavGroupProps[];
  isFolded?: boolean;
}

export const Sidenav: React.FunctionComponent<SidenavProps> = props => {
  const useStyles = makeStyles({
    root: { display: "flex", flexDirection: "column" }
  });

  const classes = useStyles();

  return (
    <div className={classes.root}>
      {props.groups.map(group => (
        <SidenavGroup {...group} isFolded={props.isFolded} />
      ))}
    </div>
  );
};
