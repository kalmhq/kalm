import { makeStyles, Theme, createStyles, withStyles } from "@material-ui/core/styles";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Typography from "@material-ui/core/Typography";
import React from "react";
import ScrollContainer from "../../widgets/ScrollContainer";
import { Paper, Fade } from "@material-ui/core";

interface StyledTabProps {
  label: string;
}

const StyledTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(1),
      borderBottomRightRadius: theme.spacing(12),
      borderTopRightRadius: theme.spacing(12),
      marginRight: theme.spacing(2),
      minHeight: "auto",
      padding: theme.spacing(1),
      "&:last-child": {
        marginBottom: theme.spacing(1)
      }
    },
    selected: {
      background: "#039be5",
      color: "white"
    }
  })
)((props: StyledTabProps) => <Tab {...props} />);

interface TabPanelProps {
  children?: React.ReactNode;
  className?: string;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    />
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
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  top: {
    flexGrow: 1,
    overflow: "hidden",
    display: "flex"
  },
  bottom: {
    height: "auto",
    flexDirection: "row-reverse",
    display: "flex",
    padding: theme.spacing(1),
    "& button": {
      marginRight: theme.spacing(1)
    },
    zIndex: 2
  },
  tabs: {
    width: "180px"
  },
  left: {
    padding: theme.spacing(2),
    paddingRight: 0
  },
  right: {
    flex: 1,
    overflow: "hidden",
    zIndex: 1
  },
  rightContent: {
    padding: theme.spacing(2)
  },
  panel: {}
}));

interface VerticalTabsProps {
  tabs: { title: string; component: React.ReactNode }[];
  tabsBottomContent?: React.ReactNode;
}

export function VerticalTabs({ tabs, tabsBottomContent }: VerticalTabsProps) {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <div className={classes.top}>
        <div className={classes.left}>
          <Paper>
            <Tabs
              TabIndicatorProps={{
                style: {
                  display: "none"
                }
              }}
              orientation="vertical"
              variant="scrollable"
              value={value}
              onChange={handleChange}
              aria-label="Vertical tabs example"
              className={classes.tabs}>
              {tabs.map((x, index) => (
                <StyledTab key={x.title} label={x.title} {...a11yProps(index)} />
              ))}
            </Tabs>
          </Paper>
        </div>
        {tabs.map((x, index) => (
          <Fade in={value === index} key={index}>
            <TabPanel value={value} index={index} className={classes.right}>
              <ScrollContainer className={classes.rightContent}>
                <Paper className={classes.rightContent}>{x.component}</Paper>
              </ScrollContainer>
            </TabPanel>
          </Fade>
        ))}
      </div>
      <Paper elevation={8} className={classes.bottom} square>
        {tabsBottomContent}
      </Paper>
    </div>
  );
}
