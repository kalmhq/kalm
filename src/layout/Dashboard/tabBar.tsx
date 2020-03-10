import React from "react";
import { createStyles, Theme, AppBar, Tab, Tabs, Avatar } from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import { NavLink } from "react-router-dom";

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
    text: "Disks",
    to: "/cluster/disks"
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
      backgroundColor: "#2196F3"
    },
    barContainer: {
      height: "100%",
      width: "1200px",
      margin: "0 auto",
      position: "relative"
    },
    barTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      padding: "15px 0"
    },
    barStatus: {
      position: "absolute",
      top: "15px",
      right: "0px"
    },
    tabs: {
      width: "1200px",
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

interface Props extends WithStyles<typeof styles> {}

const TabBarComponentRaw = ({ classes }: Props) => {
  const [value, setValue] = React.useState(window.location.pathname);

  const handleChange = (event: object, value: any) => {
    // console.log("tab value", value);
    setValue(value);
  };

  return (
    <AppBar position="relative" className={classes.appBar}>
      <div className={classes.barContainer}>
        <div className={classes.barTitle}>OpenCore Kapp</div>
        <div className={classes.barStatus}>
          <Avatar>A</Avatar>
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
    </AppBar>
  );
};

export const TabBarComponent = withStyles(styles)(TabBarComponentRaw);
