import { createStyles, List, ListItem, ListItemIcon, ListItemText, makeStyles, Theme } from "@material-ui/core";
import AppsIcon from "@material-ui/icons/Apps";
import React from "react";
import { NavLink, useRouteMatch } from "react-router-dom";
import { KalmComponentsIcon } from "widgets/Icon";

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
        theme.palette.type === "light" ? theme.palette.primary.dark : theme.palette.primary.light
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

export const DomainsSidebar: React.FC<Props> = (props) => {
  const classes = useStyles();
  let match = useRouteMatch();
  const menus = [
    {
      text: "Domains",
      to: "/domains",
      icon: <KalmComponentsIcon />,
      highlightWhenExact: false,
    },
    {
      text: "Certificate",
      to: "/certificates",
      icon: <KalmComponentsIcon />,
      highlightWhenExact: false,
    },
  ];

  return (
    <List style={{ width: "100%" }}>
      {menus.map((item) => (
        <ListItem
          className={classes.listItem}
          classes={{
            selected: classes.listItemSelected,
          }}
          button
          component={NavLink}
          to={item.to}
          key={item.text}
          selected={item.highlightWhenExact ? match.path === item.to : match.path.startsWith(item.to.split("?")[0])}
        >
          <ListItemIcon>{item.icon ? item.icon : <AppsIcon />}</ListItemIcon>
          <ListItemText classes={{ primary: classes.listItemText }} primary={item.text} />
        </ListItem>
      ))}
    </List>
  );
};
