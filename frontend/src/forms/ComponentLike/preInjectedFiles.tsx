import { Box, Button } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import EditIcon from "@material-ui/icons/Edit";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { FinalBoolCheckboxRender } from "forms/Final/checkbox";
import { FinalTextField } from "forms/Final/textfield";
import { trimParse } from "forms/normalizer";
import React from "react";
import { Field } from "react-final-form";
import { FieldArray, FieldArrayRenderProps } from "react-final-form-arrays";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { PreInjectedFile } from "types/componentTemplate";
import StringConstants from "utils/stringConstants";
import { ControlledDialog } from "widgets/ControlledDialog";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { RichEditor } from "widgets/RichEditor";
import { ValidatorInjectedFilePath } from "../validator";

interface State {
  editingFileIndex: number;
  fileContentValue: string;
  activeIndex: number;
}

interface Props extends FieldArrayRenderProps<PreInjectedFile, any>, TDispatchProp {}

const updateContentDialogID = "update-content-dialog";

class RenderPreInjectedFileRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const { fields } = props;

    this.state = {
      editingFileIndex: -1,
      fileContentValue: "",
      activeIndex: fields.value ? fields.value.length : 0,
    };
  }

  private privateOpenEditDialog = (file: PreInjectedFile, index: number) => {
    const { dispatch } = this.props;
    this.setState({ editingFileIndex: index, fileContentValue: file.content });
    dispatch(openDialogAction(updateContentDialogID));
  };

  private handleDiscard() {
    const { fields, dispatch } = this.props;
    const { editingFileIndex, activeIndex } = this.state;

    if (editingFileIndex === activeIndex) {
      fields.remove(editingFileIndex);
    }
    dispatch(closeDialogAction(updateContentDialogID));
  }

  private handleSave(isInvalidFile: boolean | undefined, file: any, mountPath: string) {
    const { fields, dispatch } = this.props;
    const { editingFileIndex, activeIndex, fileContentValue } = this.state;
    if (isInvalidFile) {
      return;
    }

    fields.update(editingFileIndex, { ...file, content: fileContentValue, mountPath: mountPath });
    if (editingFileIndex === activeIndex) {
      this.setState({ activeIndex: activeIndex + 1 });
    }
    dispatch(closeDialogAction(updateContentDialogID));
  }

  private handleChangeEditor(value: string) {
    this.setState({ fileContentValue: value });
  }

  private handleRemove(index: number) {
    const { fields } = this.props;
    const { activeIndex } = this.state;
    fields.remove(index);
    this.setState({ activeIndex: activeIndex - 1 });
  }

  private handlePush() {
    const { activeIndex } = this.state;
    const { fields } = this.props;
    const initFile = { readonly: true, content: "", mountPath: "" };
    if (!fields.value || fields.value.length <= activeIndex) {
      fields.push(initFile);
    } else {
      fields.pop();
      fields.push(initFile);
    }
    this.privateOpenEditDialog(initFile, activeIndex);
  }

  private renderEditContentDialog = () => {
    const { fields } = this.props;
    const syncErrors = fields.error as { [key: string]: string }[] | undefined;
    const { editingFileIndex, fileContentValue } = this.state;
    const file = editingFileIndex > -1 && fields.value ? fields.value[editingFileIndex] : null;
    const mountPath = file && file.mountPath ? file.mountPath : "";
    const isInvalidFile =
      !mountPath ||
      !fileContentValue ||
      (syncErrors && syncErrors[editingFileIndex] && !!syncErrors[editingFileIndex].mountPath);

    return (
      <ControlledDialog
        dialogID={updateContentDialogID}
        title="Edit file content"
        dialogProps={{
          fullWidth: true,
          maxWidth: "sm",
        }}
        closeCallback={this.handleDiscard.bind(this)}
        actions={
          <>
            <Button onClick={this.handleDiscard.bind(this)} color="primary">
              Discard
            </Button>
            <Button
              disabled={isInvalidFile}
              onClick={this.handleSave.bind(this, isInvalidFile, file, mountPath)}
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
              name={`preInjectedFiles.${editingFileIndex}.mountPath`}
              label="Mount Path"
              component={FinalTextField}
              validate={ValidatorInjectedFilePath}
              parse={trimParse}
              placeholder={StringConstants.MOUNT_PATH_PLACEHOLDER}
            />
          </Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={3}>
            <Field
              type="checkbox"
              name={`preInjectedFiles.${editingFileIndex}.readonly`}
              component={FinalBoolCheckboxRender}
              label="Read Only"
            />
          </Grid>
        </Grid>
        <RichEditor value={fileContentValue} onChange={this.handleChangeEditor.bind(this)} />
      </ControlledDialog>
    );
  };

  public render() {
    const { fields } = this.props;
    const name = fields.name;
    let fieldsNodes: any = [];
    if (fields.value) {
      fields.value.forEach((injectedFile: PreInjectedFile, index: number) => {
        if (injectedFile.mountPath) {
          fieldsNodes.push(
            <Grid container spacing={1} key={index}>
              <Grid item xs={4}>
                <Field
                  name={`${name}.${index}.mountPath`}
                  component={FinalTextField}
                  disabled
                  label="Mount Path"
                  file={injectedFile}
                  index={index}
                  placeholder={StringConstants.MOUNT_PATH_PLACEHOLDER}
                />
              </Grid>
              <Grid item xs={4}>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Edit"
                  aria-label="edit"
                  onClick={this.privateOpenEditDialog.bind(this, injectedFile, index)}
                >
                  <EditIcon />
                </IconButtonWithTooltip>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Delete"
                  aria-label="delete"
                  onClick={this.handleRemove.bind(this, index)}
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
            onClick={this.handlePush.bind(this)}
          >
            New File
          </Button>
        </Box>
      </>
    );
  }
}

const RenderPreInjectedFile = connect()(RenderPreInjectedFileRaw);

export const PreInjectedFiles = () => {
  return <FieldArray name="preInjectedFiles" component={RenderPreInjectedFile} />;
};
