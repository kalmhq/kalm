import { Box, Button } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import EditIcon from "@material-ui/icons/Edit";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { FastField, Field, FieldArray, FieldArrayRenderProps, getIn } from "formik";
import { KFormikBoolCheckboxRender } from "forms/Basic/checkbox";
import { KRenderDebounceFormikTextField } from "forms/Basic/textfield";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { PreInjectedFile } from "types/componentTemplate";
import { ControlledDialog } from "widgets/ControlledDialog";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
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
    this.setState({ editingFileIndex: index, fileContentValue: file.content });
    dispatch(openDialogAction(updateContentDialogID));
  };

  private renderEditContentDialog = () => {
    const {
      dispatch,
      name,
      remove,
      form: { values, errors },
      replace,
    } = this.props;
    const syncErrors = getIn(errors, name) as { [key: string]: string }[] | undefined;
    const { editingFileIndex, fileContentValue, activeIndex } = this.state;
    const file = editingFileIndex > -1 ? getIn(values, name)[editingFileIndex] : null;
    const mountPathTmp = file ? file.mountPathTmp : "";
    const isInvalidFile =
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
            <Button
              onClick={() => {
                if (isInvalidFile) {
                  remove(editingFileIndex);
                }
                dispatch(closeDialogAction(updateContentDialogID));
              }}
              color="primary"
            >
              Discard
            </Button>
            <Button
              disabled={isInvalidFile}
              onClick={() => {
                if (isInvalidFile) {
                  return;
                }
                replace(editingFileIndex, { ...file, content: fileContentValue, mountPath: mountPathTmp });
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
              name={`preInjectedFiles.${editingFileIndex}.mountPathTmp`}
              label="Mount Path"
              component={KRenderDebounceFormikTextField}
              validate={validateMountPath}
            />
          </Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={3}>
            <FastField
              name={`preInjectedFiles.${editingFileIndex}.readonly`}
              component={KFormikBoolCheckboxRender}
              label="Read Only"
            />
          </Grid>
        </Grid>
        <RichEdtor value={fileContentValue} onChange={(value) => this.setState({ fileContentValue: value })} />
      </ControlledDialog>
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
        if (injectedFile.mountPath) {
          fieldsNodes.push(
            <Grid container spacing={1} key={index}>
              <Grid item xs={4}>
                <FastField
                  name={`${name}.${index}.mountPath`}
                  component={KRenderDebounceFormikTextField}
                  disabled={true}
                  label="Mount Path"
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
              const initFile = {
                readonly: true,
                content: "",
                mountPath: "",
              };
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

const RenderPreInjectedFile = connect()(RenderPreInjectedFileRaw);

export const PreInjectedFiles = (props: any) => {
  return <FieldArray name="preInjectedFiles" component={RenderPreInjectedFile} {...props} />;
};
