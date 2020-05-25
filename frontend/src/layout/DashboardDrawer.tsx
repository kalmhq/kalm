import { createStyles, List, ListItem, ListItemIcon, ListItemText, Theme, ListSubheader } from "@material-ui/core";
import AppsIcon from "@material-ui/icons/Apps";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { NavLink } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { BaseDrawer } from "./BaseDrawer";
import { primaryBackgroud, primaryColor } from "../theme";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  return {
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
    entity
  };
};

const styles = (theme: Theme) =>
  createStyles({
    listItem: {
      color: "#000000 !important",
      height: 40,

      "& > .MuiListItemIcon-root": {
        minWidth: 40
      }
    },
    listItemSeleted: {
      backgroundColor: `${primaryBackgroud} !important`,
      borderRight: `4px solid ${primaryColor}`
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: "#000000 !important"
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
}

interface State {}

class DashboardDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  private getMenuDataApplication() {
    return [
      {
        text: "Applications",
        to: "/applications"
      },
      {
        text: "Templates",
        to: "/templates"
      }
    ];
  }

  private getMenuDataCluster() {
    return [
      {
        text: "Nodes",
        to: "/cluster/nodes"
      },
      {
        text: "Volumes",
        to: "/cluster/volumes"
      },
      {
        text: "Registries",
        to: "/cluster/registries"
      }
    ];
  }

  render() {
    const { classes } = this.props;
    const pathname = window.location.pathname;

    return (
      <BaseDrawer>
        <List>
          <ListSubheader disableSticky={true} className={classes.listSubHeader}>
            Application
          </ListSubheader>
          {this.getMenuDataApplication().map((item, index) => (
            <ListItem
              className={classes.listItem}
              classes={{
                selected: classes.listItemSeleted
              }}
              button
              component={NavLink}
              to={item.to}
              key={item.text}
              selected={pathname.startsWith(item.to.split("?")[0])}>
              <ListItemIcon>
                <AppsIcon />
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}

          <ListSubheader disableSticky={true} className={classes.listSubHeader}>
            Cluster
          </ListSubheader>
          {this.getMenuDataCluster().map((item, index) => (
            <ListItem
              className={classes.listItem}
              classes={{
                selected: classes.listItemSeleted
              }}
              button
              component={NavLink}
              to={item.to}
              key={item.text}
              selected={pathname.startsWith(item.to.split("?")[0])}>
              <ListItemIcon>
                <AppsIcon />
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </BaseDrawer>
    );
  }
}

export const DashboardDrawer = connect(mapStateToProps)(withStyles(styles)(DashboardDrawerRaw));
