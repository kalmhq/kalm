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
import { Paper } from "@material-ui/core";
import { ValidatorRequired } from "../validator";
import { ComponentFormValues } from "../../actions";

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
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(3)
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(5)
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: 400
  },
  sectionDiscription: {
    fontSize: 16,
    margin: "16px 0"
  },
  input: {
    marginBottom: 12
  }
}));

function ComponentFormRaw(
  props: Props & InjectedFormProps<ComponentFormValues, Props>
) {
  const { handleSubmit } = props;
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={12} md={8} lg={8} xl={6}>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Basic
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Describe how to launch this compoent.
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <CustomTextField
                // className={classes.input}
                name="name"
                label="Name"
                margin
                validate={[ValidatorRequired]}
                helperText='The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
                placeholder="Please type the component name"
              />
              <CustomTextField
                // className={classes.input}
                name="image"
                label="Image"
                margin
                validate={[ValidatorRequired]}
                helperText='Eg: "nginx:latest", "registry.example.com/group/repo:tag"'
              />
              <CustomTextField
                name="command"
                margin
                label="Command (Optional)"
                helperText='Eg: "/bin/app", "rails server".'
              />
            </Paper>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Environment variables
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Environment variables are variable whose values are set outside
              the program, typically through functionality built into the
              component. An environment variable is made up of a name/value
              pair, it also support combine a dynamic value associated with
              other component later in a real running application. Learn More.
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <CustomEnvs />
            </Paper>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Ports
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Port is the standard way to expose your program. If you want your
              component can be accessed by some other parts, you need to define
              a port.
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <CustomPorts />
            </Paper>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Resources
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Cpu, Memory, Disk can be configured here.
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <ComponentResources />
            </Paper>
          </Grid>
        </Grid>
        <Button variant="contained" color="primary" type="submit">
          Submit
        </Button>
      </form>
    </div>
  );
}

const initialValues = {
  name: "",
  image: "",
  command: "",
  env: [],
  ports: [],
  cpu: 2600,
  memory: 2000,
  disk: []
};

export default reduxForm<ComponentFormValues, Props>({
  form: "component"
})(ComponentFormRaw);
