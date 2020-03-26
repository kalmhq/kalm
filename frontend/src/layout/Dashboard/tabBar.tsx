import React from "react";
import { createStyles, Theme, AppBar, Tab, Tabs, Avatar, IconButton } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import { NavLink } from "react-router-dom";
import SettingsIcon from "@material-ui/icons/Settings";
import { UsersDialog } from "../../widgets/UsersDialog";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import { TDispatch } from "../../types";

const mapStateToProps = (state: RootState) => {
  return {};
};

interface TabOption {
  text: string;
  to: string;
}

export const tabOptions: TabOption[] = [
  {
    text: "Dashboard",
    to: "/"
  },
  {
    text: "Application",
    to: "/applications"
  },
  {
    text: "Component Template",
    to: "/componenttemplates"
  },
  {
    text: "Configs",
    to: "/configs"
  },
  {
    text: "Routes",
    to: "/routes"
  },
  {
    text: "Nodes",
    to: "/cluster/nodes"
  },
  {
    text: "Volumes",
    to: "/cluster/volumes"
  },
  {
    text: "Dependencies",
    to: "/settings/dependencies"
  }
];

const styles = (theme: Theme) =>
  createStyles({
    appBar: {
      height: "120px",
      color: "white",
      backgroundColor: "#2196F3",
      position: "fixed",
      top: "0px",
      transition: "0.2s"
    },
    barContainer: {
      height: "100%",
      width: "100%",
      margin: "0 auto",
      position: "relative",
      padding: "0 24px",
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between"
    },
    barTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      padding: "15px 0"
    },
    barRight: {
      display: "flex",
      alignItems: "center",
      "& > *": {
        marginLeft: "8px"
      }
    },
    barAvatar: {
      cursor: "pointer"
    },
    barSettings: {
      color: "#fff"
    },
    tabs: {
      width: "100%",
      position: "absolute",
      bottom: "0"
    },
    tab: {
      "&:hover": {
        color: "#FFFFFF",
        opacity: "1"
      }
    }
  });

function a11yProps(index: any) {
  return {
    id: `header-tab-${index}`,
    "aria-controls": `header-tabpanel-${index}`
  };
}

interface Props extends WithStyles<typeof styles> {
  dispatch: TDispatch;
}

const TabBarComponentRaw = ({ classes, dispatch }: Props) => {
  let pathname = "/";
  if (window.location.pathname !== "/") {
    for (let option of tabOptions) {
      if (option.to === "/") {
        continue;
      }
      if (window.location.pathname.startsWith(option.to)) {
        pathname = option.to;
        break;
      }
    }
  }
  const [value, setValue] = React.useState(pathname);
  const [isOpenSettings, setIsOpenSettings] = React.useState(false);

  const handleChange = (event: object, value: any) => {
    // console.log("tab value", value);
    setValue(value);
  };

  window.onscroll = () => {
    if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
      // @ts-ignore
      document.getElementById("header").style.top = "-72px";
    } else {
      // @ts-ignore
      document.getElementById("header").style.top = "0px";
    }
  };

  return (
    <AppBar id="header" position="relative" className={classes.appBar}>
      <div className={classes.barContainer}>
        <div className={classes.barTitle}>OpenCore Kapp</div>
        <div className={classes.barRight}>
          <IconButton className={classes.barSettings} onClick={() => setIsOpenSettings(true)}>
            <SettingsIcon />
          </IconButton>
          <div className={classes.barAvatar}>
            <Avatar>A</Avatar>
          </div>
        </div>

        <Tabs
          value={value}
          onChange={handleChange}
          className={classes.tabs}
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={{
            style: {
              backgroundColor: "#FFFFFF"
            }
          }}>
          {tabOptions.map((option: TabOption) => {
            return (
              <Tab
                key={option.to}
                className={classes.tab}
                label={option.text}
                value={option.to}
                component={NavLink}
                to={option.to}
                {...a11yProps(option.to)}
              />
            );
          })}
        </Tabs>
      </div>
      {
        <UsersDialog
          open={isOpenSettings}
          onClose={() => {
            setIsOpenSettings(false);
          }}
        />
      }
    </AppBar>
  );
};

export const TabBarComponent = connect(mapStateToProps)(withStyles(styles)(TabBarComponentRaw));
