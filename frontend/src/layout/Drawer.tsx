import {
  Drawer,
  createStyles,
  Theme,
  Divider,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatch } from "types";
import AppsIcon from "@material-ui/icons/Apps";
import { NavLink } from "react-router-dom";
import { LEFT_SECTION_WIDTH } from "../pages/BasePage";

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
    drawer: {
      width: LEFT_SECTION_WIDTH,
      flexShrink: 0
    },
    drawerPaper: {
      width: LEFT_SECTION_WIDTH
    },
    drawerContainer: {
      overflow: "auto"
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
}

interface State {}

class DrawerComponentRaw extends React.PureComponent<Props, State> {
  private headerRef = React.createRef<React.ReactElement>();

  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  public componentDidMount() {}

  private getMenuData() {
    const { activeNamespaceName } = this.props;
    return [
      {
        text: "Namespaces",
        to: "/namespaces",
        requireAdmin: true
      },
      {
        text: "Roles & Permissions",
        to: "/roles",
        requireAdmin: true
      },
      {
        text: "Applications",
        to: "/applications?namespace=" + activeNamespaceName
      },
      {
        text: "Configs",
        to: "/configs?namespace=" + activeNamespaceName
      },
      {
        text: "Nodes",
        to: "/cluster/nodes"
      },
      {
        text: "Volumes",
        to: "/cluster/volumes"
      }
    ];
  }

  render() {
    const { classes } = this.props;
    const menuData = this.getMenuData();
    const pathname = window.location.pathname;

    return (
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper
        }}>
        <Toolbar />
        <div className={classes.drawerContainer}>
          <List>
            {menuData
              .filter(item => !item.requireAdmin)
              .map((item, index) => (
                <ListItem
                  button
                  component={NavLink}
                  to={item.to}
                  key={item.text}
                  selected={pathname.startsWith(item.to.split("?")[0])}>
                  <ListItemIcon>{<AppsIcon />}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
          </List>
          <Divider />
          <List>
            {menuData
              .filter(item => item.requireAdmin)
              .map((item, index) => (
                <ListItem
                  button
                  component={NavLink}
                  to={item.to}
                  key={item.text}
                  selected={pathname.startsWith(item.to.split("?")[0])}>
                  <ListItemIcon>{<AppsIcon />}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
          </List>
        </div>
      </Drawer>
    );
  }
}

export const DrawerComponent = connect(mapStateToProps)(withStyles(styles)(DrawerComponentRaw));
