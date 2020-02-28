import { makeStyles, Theme } from "@material-ui/core/styles";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Typography from "@material-ui/core/Typography";
import React from "react";
import ScrollContainer from "../../widgets/ScrollContainer";

interface TabPanelProps {
  children?: React.ReactNode;
  className?: string;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}>
      {value === index && children}
    </Typography>
  );
}

function a11yProps(index: any) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`
  };
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    height: "100%",
    overflow: "hidden",
    // backgroundColor: theme.palette.background.paper,
    display: "flex"
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
    width: "180px"
  },
  panel: {
    flex: 1,
    overflow: "hidden"
  }
}));

interface VerticalTabsProps {
  tabs: { title: string; component: React.ReactNode }[];
  tabsBottomContent?: React.ReactNode;
}

export function VerticalTabs({ tabs, tabsBottomContent }: VerticalTabsProps) {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs example"
        className={classes.tabs}>
        {tabs.map((x, index) => (
          <Tab key={x.title} label={x.title} {...a11yProps(index)} />
        ))}
        {tabsBottomContent}
      </Tabs>

      {tabs.map((x, index) => (
        <TabPanel value={value} index={index} className={classes.panel}>
          <ScrollContainer>{x.component}</ScrollContainer>
        </TabPanel>
      ))}
    </div>
  );
}
