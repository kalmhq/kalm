import React from "react";
import { InjectedFormProps } from "redux-form";
import { reduxForm, getFormValues } from "redux-form/immutable";
import { CustomTextField } from "../Basic";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { Button, FormControl } from "@material-ui/core";
import { ValidatorRequired, ValidatorName } from "../validator";
import { ConfigNode } from "../../types/config";
import Immutable from "immutable";
import { CustomEditor } from "./editor";
import { CustomCascader } from "./cascader";
import FormHelperText from "@material-ui/core/FormHelperText";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import { getCascaderDefaultValue, getCurrentConfig } from "../../selectors/config";
import { CustomRadioGroup } from "../Basic/radio";

export interface Props {
  onClose: any;
  formType: "new" | "edit";
  formValues?: ConfigNode;
}

const mapStateToProps = (state: RootState, props: Props) => {
  const formValues = getFormValues("config")(state) as ConfigNode;
  // console.log("formValues", formValues && formValues.toJS());
  let initialValues: ConfigNode;
  if (props.formType === "new") {
    initialValues = Immutable.fromJS({
      ancestorIds: getCascaderDefaultValue(),
      name: "",
      type: "file",
      content: "",
      children: Immutable.fromJS({})
    });
  } else {
    const config = getCurrentConfig();
    const idChain = state.get("configs").get("currentConfigIdChain");
    const newIdChain = idChain.slice(0); // copy idChain to initialValues
    newIdChain.splice(-1, 1); // remove last id
    initialValues = Immutable.fromJS({
      ancestorIds: newIdChain,
      id: config.get("id"),
      resourceVersion: config.get("resourceVersion"),
      name: config.get("name"),
      type: "file",
      content: config.get("content")
    });
  }

  return {
    formValues,
    initialValues
  };
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

// function TabPanel(props: TabPanelProps) {
//   const { children, value, index, ...other } = props;

//   return (
//     <Typography
//       component="div"
//       role="tabpanel"
//       hidden={value !== index}
//       id={`scrollable-force-tabpanel-${index}`}
//       aria-labelledby={`scrollable-force-tab-${index}`}
//       {...other}
//     >
//       {value === index && <Box p={3}>{children}</Box>}
//     </Typography>
//   );
// }

// function a11yProps(index: any) {
//   return {
//     id: `scrollable-force-tab-${index}`,
//     "aria-controls": `scrollable-force-tabpanel-${index}`
//   };
// }

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
    padding: "30px 0 20px"
  },
  cancelButton: {
    marginLeft: 15
  },
  pathAndName: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  pathWrapper: {
    width: "100%",
    marginRight: "20px"
  },
  nameWrapper: {
    width: "100%"
  },
  editorWarpper: {
    width: "100%"
  }
}));

function ConfigFormRaw(props: Props & InjectedFormProps<ConfigNode, Props>) {
  const { handleSubmit, onClose, formValues, formType } = props;
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <form onSubmit={handleSubmit}>
        <div className={classes.pathAndName}>
          <FormControl className={classes.pathWrapper} margin="normal">
            <CustomCascader />
            <FormHelperText className="MuiFormHelperText-contained MuiFormHelperText-marginDense">
              Select a folder to add config
            </FormHelperText>
          </FormControl>
          <div className={classes.nameWrapper}>
            <CustomTextField
              // className={classes.input}
              name="name"
              label="Name"
              margin
              validate={[ValidatorRequired, ValidatorName]}
              helperText="Please type the config name"
              placeholder="Please type the config name"
            />
          </div>
        </div>
        {formType === "new" && <CustomRadioGroup name="type" label="Type" options={["file", "folder"]} />}
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
        {formValues && formValues!.get("type") === "file" && (
          <FormControl margin="normal" className={classes.editorWarpper}>
            <CustomEditor />
          </FormControl>
        )}
        <div className={classes.buttons}>
          <Button variant="contained" color="primary" type="submit">
            Submit
          </Button>
          <Button onClick={onClose} color="primary" className={classes.cancelButton}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default connect(mapStateToProps)(
  reduxForm<ConfigNode, Props>({
    form: "config",
    onSubmitFail: console.log
  })(ConfigFormRaw)
);
