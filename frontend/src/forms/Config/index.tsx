import React from "react";
import { InjectedFormProps } from "redux-form";
import { reduxForm, getFormValues } from "redux-form/immutable";
import { CustomTextField } from "../Basic";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { Button, FormControl } from "@material-ui/core";
import { ValidatorRequired, ValidatorName } from "../validator";
import { ConfigNode, ConfigNodeType } from "../../types/config";
import Immutable from "immutable";
import { CustomEditor } from "./editor";
import { AncestorIds } from "./ancestorIds";
import FormHelperText from "@material-ui/core/FormHelperText";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import { getAncestorIdsDefaultValue, getCurrentConfig } from "../../selectors/config";
import { CustomizedButton } from "../../widgets/Button";

export interface Props {
  onClose: any;
  formType: "new" | "edit";
  configType: ConfigNodeType;
  formValues?: ConfigNode;
  isSubmittingConfig?: boolean;
}

const mapStateToProps = (state: RootState, props: Props) => {
  const formValues = getFormValues("config")(state) as ConfigNode;
  // console.log("formValues", formValues && formValues.toJS());
  let initialValues: ConfigNode;
  if (props.formType === "new") {
    initialValues = Immutable.fromJS({
      ancestorIds: getAncestorIdsDefaultValue(),
      name: "",
      type: props.configType,
      oldPath: "",
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
      name: config.get("name"),
      oldPath: config.get("oldPath"),
      type: "file",
      content: config.get("content")
    });
  }

  return {
    formValues,
    initialValues,
    isSubmittingConfig: state.get("configs").get("isSubmittingConfig")
  };
};

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
  buttons: {
    padding: "30px 0 20px",
    display: "flex"
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

const ConfigFormRaw = (props: Props & InjectedFormProps<ConfigNode, Props>) => {
  const { handleSubmit, onClose, configType, isSubmittingConfig } = props;
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <form onSubmit={handleSubmit}>
        <div className={classes.pathAndName}>
          <FormControl className={classes.pathWrapper} margin="normal">
            <AncestorIds />
            <FormHelperText className="MuiFormHelperText-contained MuiFormHelperText-marginDense">
              Select a folder to add config
            </FormHelperText>
          </FormControl>

          <div className={classes.nameWrapper}>
            <CustomTextField
              name="name"
              label="Name"
              margin
              validate={[ValidatorRequired, ValidatorName]}
              helperText="Please type the config name"
              placeholder="Please type the config name"
            />
          </div>
        </div>

        {/* {formType === "new" && <CustomRadioGroup name="type" label="Type" options={["file", "folder"]} />} */}

        {configType === "file" && (
          <FormControl margin="normal" className={classes.editorWarpper}>
            <CustomEditor />
          </FormControl>
        )}

        <div className={classes.buttons}>
          <CustomizedButton pending={isSubmittingConfig} variant="contained" color="primary" type="submit">
            Submit
          </CustomizedButton>
          <Button onClick={onClose} color="primary" className={classes.cancelButton}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default connect(mapStateToProps)(
  reduxForm<ConfigNode, Props>({
    form: "config",
    onSubmitFail: console.log
  })(ConfigFormRaw)
);
