import { Box, Button, Icon } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import EditIcon from "@material-ui/icons/Edit";
import { Alert } from "@material-ui/lab";
import { closeDialogAction, openDialogAction } from "actions/dialog";
import { KBoolCheckboxRender } from "forms/Basic/checkbox";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayPush, arrayRemove, change, WrappedFieldArrayProps, WrappedFieldProps, arrayPop } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { PreInjectedFile } from "types/componentTemplate";
import { ControlledDialog } from "widgets/ControlledDialog";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { RichEdtor } from "widgets/RichEditor";
import { KRenderDebounceTextField } from "../Basic/textfield";
import { KValidatorInjectedFilePath, ValidatorRequired } from "../validator";
import { RootState } from "reducers";
import { Label } from "widgets/Label";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  validate: any;
}

interface State {
  editingFileIndex: number;
  fileContentValue: string;
  activeIndex: number;
}

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface OwnProps {
  formID: string;
}

interface Props extends WrappedFieldArrayProps<PreInjectedFile>, FieldArrayComponentHackType, FieldArrayProps {}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  return {
    syncError: state.getIn(["form", ownProps.formID, "syncErrors", "preInjectedFiles"]),
  };
};

const updateContentDialogID = "update-content-dialog";
const validateMountPath = [ValidatorRequired, KValidatorInjectedFilePath];

class RenderPreInjectedFileRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      editingFileIndex: -1,
      fileContentValue: "",
      activeIndex: props.fields.length,
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
      fields,
      meta: { form },
      syncError,
    } = this.props;
    const { editingFileIndex, fileContentValue, activeIndex } = this.state;
    const file = fields.get(editingFileIndex);
    const mountPathTmp = file ? file.get("mountPathTmp") : "";
    const isDisabledSaveButton =
      !mountPathTmp ||
      !fileContentValue ||
      (syncError && syncError[editingFileIndex] && !!syncError[editingFileIndex].mountPathTmp);

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
                dispatch(change(form, "preInjectedFiles[" + editingFileIndex + "]", newFile));
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
              component={KRenderDebounceTextField}
              margin
              validate={validateMountPath}
            />
          </Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={3}>
            <Field
              name={`preInjectedFiles[${editingFileIndex}].readonly`}
              component={KBoolCheckboxRender}
              label="Read Only"
            ></Field>
          </Grid>
        </Grid>
        <RichEdtor value={fileContentValue} onChange={(value) => this.setState({ fileContentValue: value })} />
      </ControlledDialog>
    );
  };

  private renderContent = ({ meta: { error }, file }: WrappedFieldProps & { file: PreInjectedFile; index: number }) => {
    return (
      <Label color={error ? "error" : undefined} style={{ padding: 12, width: "100%" }}>
        {error ? "File Content Required" : file.get("mountPath") || "Config File"}
      </Label>
    );
  };

  public render() {
    const {
      meta: { form, error },
      fields,
      dispatch,
    } = this.props;
    const { activeIndex } = this.state;
    let fieldsNodes: any = [];
    fields.forEach((member, index) => {
      const injectedFile = fields.get(index);
      if (injectedFile.get("mountPath")) {
        fieldsNodes.push(
          <Grid container spacing={1} key={member}>
            <Grid item xs={4}>
              <Field
                name={`${member}.content`}
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
                  dispatch(arrayRemove(form, "preInjectedFiles", index));
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
    return (
      <>
        {this.renderEditContentDialog()}
        {fieldsNodes}
        <Box mb={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Icon>add</Icon>}
            size="small"
            onClick={() => {
              const initFile = Immutable.Map({
                readonly: true,
                content: "",
                mountPath: "",
              });
              if (fields.length <= activeIndex) {
                dispatch(arrayPush(form, "preInjectedFiles", initFile));
              } else {
                dispatch(arrayPop(form, "preInjectedFiles"));
                dispatch(arrayPush(form, "preInjectedFiles", initFile));
              }
              this.privateOpenEditDialog(initFile, activeIndex);
            }}
          >
            New File
          </Button>
          {error ? (
            <Box mb={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : null}
        </Box>
      </>
    );
  }
}

const ValidatorInjectedFiles = (
  values: Immutable.List<PreInjectedFile>,
  _allValues?: any,
  _props?: any,
  _name?: any,
) => {
  if (!values) return undefined;
  const mountPaths = new Set<string>();

  for (let i = 0; i < values.size; i++) {
    const path = values.get(i)!;
    const mountPath = path.get("mountPath");

    if (!mountPaths.has(mountPath)) {
      mountPaths.add(mountPath);
    } else if (mountPath !== "") {
      return "Files paths should be unique.  " + mountPath + "";
    }
  }
};

const RenderPreInjectedFile = connect(mapStateToProps)(RenderPreInjectedFileRaw);

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
