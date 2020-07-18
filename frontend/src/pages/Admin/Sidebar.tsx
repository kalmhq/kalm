import { createStyles, List, ListItem, ListItemIcon, ListItemText, Theme } from "@material-ui/core";
import AppsIcon from "@material-ui/icons/Apps";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { NavLink, RouteComponentProps, withRouter } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { primaryBackgroud, primaryColor } from "theme/theme";
import { blinkTopProgressAction } from "actions/settings";
import { KalmComponentsIcon } from "widgets/Icon";

const mapStateToProps = (state: RootState) => {
  return {};
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

class AdminSidebarRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  private getMenuData() {
    return [
      {
        text: "Single Sign-on",
        to: "/admin/sso",
        icon: <KalmComponentsIcon />,
        highlightWhenExact: false,
      },
    ];
  }

  public render() {
    const {
      classes,
      location: { pathname },
    } = this.props;

    const menuData = this.getMenuData();

    return (
      <List style={{ width: "100%" }}>
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
    );
  }
}

export const AdminSidebar = withRouter(connect(mapStateToProps)(withStyles(styles)(AdminSidebarRaw)));
