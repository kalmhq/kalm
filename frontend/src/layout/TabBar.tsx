import { AppBar, Avatar, createStyles, Tab, Tabs, Theme } from "@material-ui/core";
import blue from "@material-ui/core/colors/blue";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { FlexRowItemCenterBox } from "widgets/Box";
import { Namespaces } from "widgets/Namespaces";
import { OnlyVisiableToAdmin } from "permission/Role";

const mapStateToProps = (state: RootState) => {
  return {};
};

interface TabOption {
  text: string;
  to: string;
  requireAdmin?: boolean;
}

const HEADER_HEIGHT = 120;
const TABS_HEIGHT = 48;

const styles = (theme: Theme) =>
  createStyles({
    appBar: {
      height: HEADER_HEIGHT,
      color: "white",
      backgroundColor: blue[500],
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
      color: "inherit",
      fontSize: "24px",
      fontWeight: "bold",
      padding: "15px 0",
      "&:hover": {
        color: "inherit"
      }
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
      width: "calc(100% - 48px)",
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
  title: string;
  tabOptions: TabOption[];
  isAdmin?: boolean; // refactor this option and layout, temporary solution
}

const TabBarComponentRaw = ({ classes, dispatch, title, isAdmin, tabOptions }: Props) => {
  let pathname = "/";

  if (window.location.pathname !== "/") {
    for (let option of tabOptions) {
      if (option.to === "/") {
        continue;
      }
      if (window.location.pathname.startsWith(option.to.split("?")[0])) {
        pathname = option.to;
        break;
      }
    }
  }
  const [value, setValue] = React.useState(pathname);

  const handleChange = (event: object, value: any) => {
    // console.log("tab value", value);
    setValue(value);
  };

  const headerRef = React.createRef();

  // Shrink header
  window.onscroll = () => {
    if ((document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) && headerRef.current) {
      // @ts-ignore
      headerRef.current.style.top = `${TABS_HEIGHT - HEADER_HEIGHT}px`;
    } else {
      // @ts-ignore
      headerRef.current.style.top = "0px";
    }
  };

  return (
    <AppBar ref={headerRef} id="header" position="relative" className={classes.appBar}>
      <div className={classes.barContainer}>
        <FlexRowItemCenterBox>
          <Link className={classes.barTitle} to="/">
            {title}
          </Link>
          {isAdmin ? null : <Namespaces />}
        </FlexRowItemCenterBox>
        <div className={classes.barRight}>
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
            const tab = (
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

            if (option.requireAdmin) {
              return <OnlyVisiableToAdmin>{tab}</OnlyVisiableToAdmin>;
            }

            return tab;
          })}
        </Tabs>
      </div>
    </AppBar>
  );
};

export const TabBarComponent = connect(mapStateToProps)(withStyles(styles)(TabBarComponentRaw));
