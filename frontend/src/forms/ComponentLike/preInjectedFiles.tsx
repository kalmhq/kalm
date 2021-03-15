import { Box, Button, Link } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import EditIcon from "@material-ui/icons/Edit";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { FinalBoolCheckboxRender } from "forms/Final/checkbox";
import { FinalTextField } from "forms/Final/textfield";
import { trimParse } from "forms/normalizer";
import { default as React } from "react";
import { Field } from "react-final-form";
import { FieldArray, FieldArrayRenderProps } from "react-final-form-arrays";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { PreInjectedFile } from "types/componentTemplate";
import { default as sc, default as StringConstants } from "utils/stringConstants";
import { ControlledDialog } from "widgets/ControlledDialog";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Subtitle1 } from "widgets/Label";
import { RichEditor } from "widgets/RichEditor";
import { SectionTitle } from "widgets/SectionTitle";
import { HelperTextSection } from ".";
import { ValidatorInjectedFilePath } from "../validator";

interface State {
  editingFileIndex: number;
  fileContentValue: string;
  latestIndex: number;
}

interface Props extends FieldArrayRenderProps<PreInjectedFile, any>, TDispatchProp {}

const UpdateContentDialogID = "update-content-dialog";

class RenderPreInjectedFileRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const { fields } = props;

    this.state = {
      editingFileIndex: -1,
      fileContentValue: "",
      latestIndex: fields.value ? fields.value.length : 0,
    };
  }

  private openEditDialog = (file: PreInjectedFile, index: number) => {
    const { dispatch, fields } = this.props;
    this.setState({ editingFileIndex: index, fileContentValue: file.content });
    fields.update(index, { ...file, mountPathTmp: file.mountPath });
    dispatch(openDialogAction(UpdateContentDialogID));
  };

  private handleDiscard() {
    const { fields, dispatch } = this.props;
    const { editingFileIndex } = this.state;
    if (fields.value && fields.value[editingFileIndex] && !fields.value[editingFileIndex].mountPath) {
      fields.remove(editingFileIndex);
    }
    dispatch(closeDialogAction(UpdateContentDialogID));
  }

  private handleSave(file: any, mountPathTmp: string) {
    const { fields, dispatch } = this.props;
    const { editingFileIndex, latestIndex, fileContentValue } = this.state;
    fields.update(editingFileIndex, { ...file, content: fileContentValue, mountPath: mountPathTmp });
    if (editingFileIndex === latestIndex) {
      this.setState({ latestIndex: latestIndex + 1 });
    }
    dispatch(closeDialogAction(UpdateContentDialogID));
  }

  private handleChangeEditor(value: string) {
    this.setState({ fileContentValue: value });
  }

  private handleRemove(index: number) {
    const { fields } = this.props;
    const { latestIndex } = this.state;
    fields.remove(index);
    this.setState({ latestIndex: latestIndex - 1 });
  }

  private handlePush() {
    const { latestIndex } = this.state;
    const { fields } = this.props;
    const initFile = { readonly: false, content: "", mountPath: "" };
    fields.push(initFile);
    this.openEditDialog(initFile, latestIndex);
  }

  private renderEditContentDialog = () => {
    const {
      fields,
      meta: { error },
    } = this.props;
    const { editingFileIndex, fileContentValue } = this.state;
    const file = editingFileIndex > -1 && fields.value ? fields.value[editingFileIndex] : null;
    const mountPathTmp = file ? file.mountPath || file.mountPathTmp || "" : "";

    return (
      <ControlledDialog
        dialogID={UpdateContentDialogID}
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
              disabled={error && error[editingFileIndex]}
              onClick={this.handleSave.bind(this, file, mountPathTmp)}
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
              component={FinalTextField}
              validate={ValidatorInjectedFilePath}
              parse={trimParse}
              placeholder={StringConstants.MOUNT_PATH_PLACEHOLDER}
            />
          </Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={3}>
            <Field
              name={`preInjectedFiles.${editingFileIndex}.readonly`}
              component={FinalBoolCheckboxRender}
              type="checkbox"
              label="Read Only"
            />
          </Grid>
        </Grid>
        <RichEditor
          value={fileContentValue}
          onChange={this.handleChangeEditor.bind(this)}
          height="300px"
          minLines={80}
        />
      </ControlledDialog>
    );
  };

  public render() {
    const { fields } = this.props;
    const name = fields.name;
    let fieldsNodes: any = [];
    if (fields.value) {
      fields.value.forEach((injectedFile: PreInjectedFile, index: number) => {
        if (injectedFile && injectedFile.mountPath) {
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
                  onClick={this.openEditDialog.bind(this, injectedFile, index)}
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
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Config Files</Subtitle1>
            <Box mb={2} mt={2} ml={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                size="small"
                style={{ height: 18, borderRadius: 5, fontSize: 12 }}
                onClick={this.handlePush.bind(this)}
              >
                New File
              </Button>
            </Box>
          </SectionTitle>
        </Grid>
        <Grid item xs={12}>
          <HelperTextSection>
            {sc.CONFIG_COMMAND_HELPER}
            <span>&nbsp;</span>
            <Link href="https://docs.kalm.dev/guide-config#adding-a-config-file" target="_blank">
              {sc.LEARN_MORE_LABEL}
            </Link>
          </HelperTextSection>
        </Grid>
        <Grid item xs={12}>
          {this.renderEditContentDialog()}
          {fieldsNodes}
        </Grid>
      </>
    );
  }
}

const RenderPreInjectedFile = connect()(RenderPreInjectedFileRaw);

export const PreInjectedFiles = () => {
  return <FieldArray name="preInjectedFiles" component={RenderPreInjectedFile} />;
};
