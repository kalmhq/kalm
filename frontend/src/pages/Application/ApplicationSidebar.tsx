import { createStyles, List, ListItem, ListItemIcon, ListItemText, makeStyles, Theme } from "@material-ui/core";
import AppsIcon from "@material-ui/icons/Apps";
import { blinkTopProgressAction } from "actions/settings";
import React from "react";
import { useSelector } from "react-redux";
import { NavLink, withRouter } from "react-router-dom";
import { RootState } from "store";
import sc from "utils/stringConstants";
import { DashboardIcon, KalmComponentsIcon, SettingIcon } from "widgets/Icon";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    listItem: {
      height: 40,

      "& > .MuiListItemIcon-root": {
        minWidth: 40,
        marginLeft: -4,
      },
      borderLeft: `4px solid transparent`,
    },
    listItemSelected: {
      borderLeft: `4px solid ${
        theme.palette.type === "light" ? theme.palette.primary.main : theme.palette.primary.light
      }`,
    },
    listSubHeader: {
      textTransform: "uppercase",
    },
    listItemText: {
      "font-size": theme.typography.subtitle1.fontSize,
    },
  }),
);

interface Props {}

const ApplicationViewDrawerRaw: React.FC<Props> = (props) => {
  const classes = useStyles();

  const { activeNamespaceName } = useSelector((state: RootState) => {
    return {
      activeNamespaceName: state.namespaces.active,
    };
  });

  const getMenuData = () => {
    const menus = [];
    menus.push({
      text: "Components",
      to: "/applications/" + activeNamespaceName + "/components",
      icon: <KalmComponentsIcon />,
    });

    menus.push({
      text: sc.APP_DASHBOARD_PAGE_NAME,
      to: "/applications/" + activeNamespaceName + "/metrics",
      highlightWhenExact: true,
      icon: <DashboardIcon />,
    });

    menus.push({
      text: sc.APP_SETTINGS_PAGE_NAME,
      to: "/applications/" + activeNamespaceName + "/settings",
      highlightWhenExact: true,
      icon: <SettingIcon />,
    });
    return menus;
  };
  const menuData = getMenuData();

  const pathname = window.location.pathname;

  return (
    <List style={{ width: "100%" }}>
      {menuData.map((item, index) => (
        <ListItem
          onClick={() => blinkTopProgressAction()}
          className={classes.listItem}
          classes={{
            selected: classes.listItemSelected,
          }}
          button
          component={NavLink}
          to={item.to}
          key={item.text}
          selected={item.highlightWhenExact ? pathname === item.to : pathname.startsWith(item.to.split("?")[0])}
        >
          <ListItemIcon>{item.icon ? item.icon : <AppsIcon />}</ListItemIcon>
          <ListItemText classes={{ primary: classes.listItemText }} primary={item.text} />
        </ListItem>
      ))}
    </List>
  );
};

export const ApplicationSidebar = withRouter(ApplicationViewDrawerRaw);
