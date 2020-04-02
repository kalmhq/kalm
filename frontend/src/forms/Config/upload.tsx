import React from "react";
import { InjectedFormProps } from "redux-form";
import { reduxForm } from "redux-form/immutable";
import { Theme, WithStyles, createStyles, withStyles } from "@material-ui/core/styles";
import { Button, FormControl } from "@material-ui/core";
import { FilesUpload } from "../../types/config";
import Immutable from "immutable";
import { CustomCascader } from "./cascader";
import FormHelperText from "@material-ui/core/FormHelperText";
import { connect } from "react-redux";
import { RootState } from "../../reducers";
import Dropzone from "react-dropzone";
import { getCascaderDefaultValue } from "../../selectors/config";
import { uploadConfigsAction } from "../../actions/config";
import { TDispatch } from "../../types";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";
import DeleteIcon from "@material-ui/icons/Delete";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: "100%",
      backgroundColor: theme.palette.background.paper,
      padding: 0
    },
    cascaderWrapper: {
      width: "100%"
    },
    buttons: {
      padding: "30px 0 20px"
    },
    cancelButton: {
      marginLeft: 15
    },
    dropzoneWrapper: {
      outline: "none !important"
    },
    dropzoneArea: {
      minHeight: "300px",
      border: "2px dashed #d0d0d0",
      borderRadius: "4px",
      outline: "none !important"
    },
    dropzoneTitle: {
      padding: "24px",
      textAlign: "center"
    },
    preveiwArea: {
      display: "flex",
      flexWrap: "wrap"
    },
    previewItem: {
      padding: "5px 30px",
      minWidth: "33%",
      display: "flex",
      alignItems: "center"
    },
    previewName: {
      marginRight: "20px"
    }
  });

interface Props extends WithStyles<typeof styles> {
  onClose: () => void;
  dispatch: TDispatch;
}

interface State {
  files: FilesUpload;
}

const mapStateToProps = (state: RootState, props: Props) => {
  const initialValues = Immutable.fromJS({
    ancestorIds: getCascaderDefaultValue()
  });
  return { initialValues };
};

class ConfigUploadFormRaw extends React.PureComponent<Props & InjectedFormProps<any, Props>, State> {
  constructor(props: Props & InjectedFormProps<any, Props>) {
    super(props);
    this.state = {
      files: Immutable.OrderedMap({})
    };
  }

  private handleDrop(files: any[]) {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target) {
          // console.log("File name", file.name);
          // console.log("File content:", event.target.result);

          const name = file.name;
          const content = event.target.result as string;
          this.setState({ files: this.state.files.set(name, content) });
        }
      };
      reader.readAsText(file);
    });
  }

  private handleDelete(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, name: string) {
    event.stopPropagation();

    this.setState({ files: this.state.files.delete(name) });
  }

  private handleSubmit(values: any) {
    const { dispatch, onClose } = this.props;
    const { files } = this.state;

    if (values) {
      dispatch(uploadConfigsAction(values.toJS().ancestorIds, files));
    }
    onClose();
  }

  public render() {
    const { handleSubmit, onClose, classes } = this.props;

    const fileNames: any[] = [];
    this.state.files.forEach((_, name) => {
      fileNames.push(
        <div key={name} className={classes.previewItem}>
          <div className={classes.previewName}>{name}</div>
          <IconButtonWithTooltip
            tooltipTitle="Delete"
            aria-label="delete"
            onClick={event => this.handleDelete(event, name)}>
            <DeleteIcon />
          </IconButtonWithTooltip>
        </div>
      );
    });

    return (
      <div className={classes.root}>
        <form onSubmit={handleSubmit(values => this.handleSubmit(values))}>
          <FormControl margin="normal" className={classes.cascaderWrapper}>
            <CustomCascader />
            <FormHelperText className="MuiFormHelperText-contained MuiFormHelperText-marginDense">
              Select a folder to upload configs
            </FormHelperText>
          </FormControl>

          {/* accept issues  */}
          {/* https://github.com/react-dropzone/react-dropzone/issues/276 */}
          <Dropzone maxSize={1000000} onDrop={files => this.handleDrop(files)}>
            {({ getRootProps, getInputProps }: { getRootProps: any; getInputProps: any }) => (
              <section>
                <div {...getRootProps()} className={classes.dropzoneWrapper}>
                  <input {...getInputProps()} />
                  <div className={classes.dropzoneArea}>
                    <div className={classes.dropzoneTitle}>Drop some files here, or click to select files</div>
                    <div className={classes.preveiwArea}>{fileNames}</div>
                  </div>
                </div>
              </section>
            )}
          </Dropzone>

          <div className={classes.buttons}>
            <Button variant="contained" color="primary" type="submit">
              Upload
            </Button>
            <Button onClick={onClose} color="primary" className={classes.cancelButton}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }
}

export default withStyles(styles)(
  connect(mapStateToProps)(
    reduxForm<any, Props>({
      form: "configUpload",
      onSubmitFail: console.log
    })(ConfigUploadFormRaw)
  )
);
