import React from "react";
import { Field, reduxForm, InjectedFormProps } from "redux-form";
import { CustomTextField, renderTextField } from "../Basic";
import { makeStyles, Theme } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import PhoneIcon from "@material-ui/icons/Phone";
import FavoriteIcon from "@material-ui/icons/Favorite";
import PersonPinIcon from "@material-ui/icons/PersonPin";
import HelpIcon from "@material-ui/icons/Help";
import ShoppingBasket from "@material-ui/icons/ShoppingBasket";
import ThumbDown from "@material-ui/icons/ThumbDown";
import ThumbUp from "@material-ui/icons/ThumbUp";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import { CustomEnvs } from "../Basic/env";
import { CustomPorts } from "../Basic/ports";
import { Button, Grid } from "@material-ui/core";
import ComponentResources from "./resources";

export interface Props {}

interface TabPanelProps {
  children?: React.ReactNode;
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
      id={`scrollable-force-tabpanel-${index}`}
      aria-labelledby={`scrollable-force-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

function a11yProps(index: any) {
  return {
    id: `scrollable-force-tab-${index}`,
    "aria-controls": `scrollable-force-tabpanel-${index}`
  };
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    width: "100%",
    backgroundColor: theme.palette.background.paper
  }
}));

function ComponentFormRaw(props: Props & InjectedFormProps<{}, Props>) {
  const { handleSubmit } = props;
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <form onSubmit={handleSubmit}>
        <AppBar position="static" color="default">
          <Tabs
            value={value}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="on"
            indicatorColor="primary"
            textColor="primary"
            aria-label="scrollable force tabs example"
          >
            <Tab label="Basic" {...a11yProps(0)} />
            <Tab label="Environment Variables" {...a11yProps(1)} />
            <Tab label="Ports" {...a11yProps(5)} />
            <Tab label="Resources" {...a11yProps(2)} />
            <Tab label="Plugins" {...a11yProps(3)} />
            <Tab label="Hooks" {...a11yProps(4)} />
          </Tabs>
        </AppBar>
        <Grid container spacing={1}>
          <Grid item xs={8}>
            <TabPanel value={value} index={0}>
              <CustomTextField
                name="name"
                label="Name"
                helperText='The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
                placeholder="Please type the component name"
              />
              <CustomTextField
                name="image"
                label="Image"
                helperText='Eg: "nginx:latest", "registry.example.com/group/repo:tag"'
              />
              <CustomTextField
                name="command"
                label="Command (Optional)"
                helperText='Eg: "/bin/app", "rails server".'
              />
            </TabPanel>
            <TabPanel value={value} index={1}>
              <CustomEnvs />
            </TabPanel>
            <TabPanel value={value} index={2}>
              <CustomPorts />
            </TabPanel>
            <TabPanel value={value} index={3}>
              <ComponentResources />
            </TabPanel>
            <TabPanel value={value} index={4}>
              Item Five
            </TabPanel>
            <TabPanel value={value} index={5}>
              Item Six
            </TabPanel>
          </Grid>
        </Grid>
        <Button variant="contained" color="primary" type="submit">
          Submit
        </Button>
      </form>
    </div>
  );
}

export default reduxForm<{}, Props>({ form: "component" })(ComponentFormRaw);
