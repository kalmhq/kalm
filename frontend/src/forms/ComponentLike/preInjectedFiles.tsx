import { Box, Button } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import EditIcon from "@material-ui/icons/Edit";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { Field, FieldArray, FieldArrayRenderProps, getIn, FieldProps } from "formik";
import { TextField as FormikTextField } from "formik-material-ui";
import { KFormikCheckbox } from "forms/Basic/checkbox";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { PreInjectedFile } from "types/componentTemplate";
import { ControlledDialog } from "widgets/ControlledDialog";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Label } from "widgets/Label";
import { RichEdtor } from "widgets/RichEditor";
import { KValidatorInjectedFilePath, ValidatorRequired } from "../validator";

interface State {
  editingFileIndex: number;
  fileContentValue: string;
  activeIndex: number;
}

interface Props extends FieldArrayRenderProps, TDispatchProp {}

const updateContentDialogID = "update-content-dialog";
const validateMountPath = (value: any) => ValidatorRequired(value) || KValidatorInjectedFilePath(value);

class RenderPreInjectedFileRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const {
      name,
      form: { values },
    } = props;
    this.state = {
      editingFileIndex: -1,
      fileContentValue: "",
      activeIndex: getIn(values, name) ? getIn(values, name).length : 0,
    };
  }

  private privateOpenEditDialog = (file: PreInjectedFile, index: number) => {
    const { dispatch } = this.props;
    this.setState({ editingFileIndex: index, fileContentValue: file.get("content") });
    dispatch(openDialogAction(updateContentDialogID));
  };

  private renderEditContentDialog = () => {
    const {
      dispatch,
      name,
      form: { values, errors },
      replace,
    } = this.props;
    const syncErrors = getIn(errors, name) as { [key: string]: string }[] | undefined;
    const { editingFileIndex, fileContentValue, activeIndex } = this.state;
    const file = editingFileIndex > -1 ? getIn(values, name)[editingFileIndex] : null;
    const mountPathTmp = file ? file.mountPathTmp : "";
    const isDisabledSaveButton =
      !mountPathTmp ||
      !fileContentValue ||
      (syncErrors && syncErrors[editingFileIndex] && !!syncErrors[editingFileIndex].mountPathTmp);

    return (
      <ControlledDialog
        dialogID={updateContentDialogID}
        title="Edit file content"
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm",
        }}
        actions={
          <>
            <Button onClick={() => dispatch(closeDialogAction(updateContentDialogID))} color="primary">
              Discard
            </Button>
            <Button
              disabled={isDisabledSaveButton}
              onClick={() => {
                if (isDisabledSaveButton) {
                  return;
                }
                let newFile = file.set("content", fileContentValue);
                newFile = newFile.set("mountPath", mountPathTmp);
                replace(editingFileIndex, newFile);
                if (editingFileIndex === activeIndex) {
                  this.setState({ activeIndex: activeIndex + 1 });
                }
                dispatch(closeDialogAction(updateContentDialogID));
              }}
              color="primary"
            >
              Save
            </Button>
          </>
        }
      >
        <Grid container>
          <Grid item xs={8}>
            <Field
              name={`preInjectedFiles[${editingFileIndex}].mountPathTmp`}
              label="Mount Path"
              component={FormikTextField}
              validate={validateMountPath}
              InputLabelProps={{
                shrink: true,
              }}
              margin="dense"
              fullWidth
              variant="outlined"
              inputProps={{
                required: false, // bypass html5 required feature
              }}
            />
          </Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={3}>
            <Field
              name={`preInjectedFiles[${editingFileIndex}].readonly`}
              component={KFormikCheckbox}
              label="Read Only"
            ></Field>
          </Grid>
        </Grid>
        <RichEdtor value={fileContentValue} onChange={(value) => this.setState({ fileContentValue: value })} />
      </ControlledDialog>
    );
  };

  private renderContent = ({
    form: { errors },
    field: { name },
    file,
  }: FieldProps & { file: PreInjectedFile; index: number }) => {
    return (
      <Label color={errors[name] ? "error" : undefined} style={{ padding: 12, width: "100%" }}>
        {errors[name] ? "File Content Required" : file.get("mountPath") || "Config File"}
      </Label>
    );
  };

  public render() {
    const {
      name,
      form: { values },
      remove,
      push,
      pop,
    } = this.props;
    const { activeIndex } = this.state;
    let fieldsNodes: any = [];
    if (getIn(values, name)) {
      getIn(values, name).forEach((injectedFile: PreInjectedFile, index: number) => {
        if (injectedFile.get("mountPath")) {
          fieldsNodes.push(
            <Grid container spacing={1} key={index}>
              <Grid item xs={4}>
                <Field
                  name={`${name}.${index}.content`}
                  component={this.renderContent}
                  file={injectedFile}
                  validate={ValidatorRequired}
                  index={index}
                />
              </Grid>
              <Grid item xs={4}>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Edit"
                  aria-label="edit"
                  onClick={() => this.privateOpenEditDialog(injectedFile, index)}
                >
                  <EditIcon />
                </IconButtonWithTooltip>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Delete"
                  aria-label="delete"
                  onClick={() => {
                    remove(index);
                    this.setState({ activeIndex: activeIndex - 1 });
                  }}
                >
                  <DeleteIcon />
                </IconButtonWithTooltip>
              </Grid>
            </Grid>,
          );
        }
      });
    }
    return (
      <>
        {this.renderEditContentDialog()}
        {fieldsNodes}
        <Box mb={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => {
              const initFile = Immutable.Map({
                readonly: true,
                content: "",
                mountPath: "",
              });
              if (!getIn(values, name) || getIn(values, name).length <= activeIndex) {
                push(initFile);
              } else {
                pop();
                push(initFile);
              }
              this.privateOpenEditDialog(initFile, activeIndex);
            }}
          >
            New File
          </Button>
          {/* {error ? (
            <Box mb={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : null} */}
        </Box>
      </>
    );
  }
}

const ValidatorInjectedFiles = (values: PreInjectedFile[]) => {
  if (!values) return undefined;
  const mountPaths = new Set<string>();

  for (let i = 0; i < values.length; i++) {
    const path = values[i]!;
    const mountPath = path.get("mountPath");

    if (!mountPaths.has(mountPath)) {
      mountPaths.add(mountPath);
    } else if (mountPath !== "") {
      return "Files paths should be unique.  " + mountPath + "";
    }
  }
};

const RenderPreInjectedFile = connect()(RenderPreInjectedFileRaw);

export const PreInjectedFiles = (props: any) => {
  return (
    <FieldArray
      name="preInjectedFiles"
      component={RenderPreInjectedFile}
      validate={ValidatorInjectedFiles}
      {...props}
    />
  );
};
