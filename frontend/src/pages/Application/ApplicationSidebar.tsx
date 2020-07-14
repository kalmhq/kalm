import { createStyles, List, ListItem, ListItemIcon, ListItemText, Theme } from "@material-ui/core";
import AppsIcon from "@material-ui/icons/Apps";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { NavLink, RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { BaseDrawer } from "layout/BaseDrawer";
import { primaryBackgroud, primaryColor } from "theme/theme";
import { blinkTopProgressAction } from "actions/settings";
import { KalmComponentsIcon, KalmRoutesIcon, DashboardIcon } from "widgets/Icon";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  return {
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
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
      color: "#000000 !important",
    },
  });

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    RouteComponentProps<{ applicationName: string }> {
  dispatch: TDispatch;
}

interface State {}

class ApplicationViewDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  private getMenuData() {
    const { activeNamespaceName } = this.props;
    return [
      {
        text: "Components",
        to: "/applications/" + activeNamespaceName + "/components",
        icon: <KalmComponentsIcon />,
      },
      {
        text: "Routes",
        to: "/applications/" + activeNamespaceName + "/routes",
        icon: <KalmRoutesIcon />,
      },
      {
        text: "Metric Dashboard",
        to: "/applications/" + activeNamespaceName + "/metrics",
        highlightWhenExact: true,
        icon: <DashboardIcon />,
      },
    ];
  }

  render() {
    const {
      classes,
      location: { pathname },
    } = this.props;
    const menuData = this.getMenuData();

    return (
      <BaseDrawer>
        <List>
          {menuData.map((item, index) => (
            <ListItem
              onClick={() => blinkTopProgressAction()}
              className={classes.listItem}
              classes={{
                selected: classes.listItemSeleted,
              }}
              button
              component={NavLink}
              to={item.to}
              key={item.text}
              selected={item.highlightWhenExact ? pathname === item.to : pathname.startsWith(item.to.split("?")[0])}
            >
              <ListItemIcon>{item.icon ? item.icon : <AppsIcon />}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </BaseDrawer>
    );
  }
}

export const ApplicationSidebar = withRouter(connect(mapStateToProps)(withStyles(styles)(ApplicationViewDrawerRaw)));
