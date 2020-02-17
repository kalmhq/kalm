import React from "react";
import { InjectedFormProps } from "redux-form";
import { Field, reduxForm } from "redux-form/immutable";
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
import { Paper } from "@material-ui/core";
import { ValidatorRequired } from "../validator";
import { Config } from "../../actions";
import { CustomRadioGroup } from "../Basic/radio";
import Immutable from "immutable";
import { CustomEditor } from "./editor";

export interface Props {
  onClose: any;
}

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
    padding: 0
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
  },
  buttons: {
    padding: "30px 0 10px"
  },
  cancelButton: {
    marginLeft: 15
  }
}));

function ConfigFormRaw(props: Props & InjectedFormProps<Config, Props>) {
  const { handleSubmit, onClose } = props;
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <form onSubmit={handleSubmit}>
        <CustomTextField
          // className={classes.input}
          name="name"
          label="Name"
          margin
          validate={[ValidatorRequired]}
          helperText='The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
          placeholder="Please type the config name"
        />
        <CustomRadioGroup
          name="type"
          label="Type"
          options={["file", "folder"]}
        />
        {/* <CustomTextField
          // className={classes.input}
          name="content"
          label="Content"
          margin
          validate={[ValidatorRequired]}
          helperText="File content"
          multiline={true}
          rows={15}
          rowsMax={15}
        /> */}
        <CustomEditor />
        <div className={classes.buttons}>
          <Button variant="contained" color="primary" type="submit">
            Submit
          </Button>
          <Button
            onClick={onClose}
            color="primary"
            className={classes.cancelButton}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

const initialValues: Config = Immutable.fromJS({
  name: "",
  type: "file",
  content: ""
});

export default reduxForm<Config, Props>({
  form: "config",
  initialValues,
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  }
})(ConfigFormRaw);
