import { Box, Button, Grid, TextField } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import HelpIcon from "@material-ui/icons/Help";
import { Field, FieldArray, getIn, FieldArrayRenderProps } from "formik";
import { KTooltip } from "forms/Application/KTooltip";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "reducers";
import {
  VolumeContent,
  VolumeTypePersistentVolumeClaim,
  VolumeTypePersistentVolumeClaimNew,
  VolumeTypeTemporaryDisk,
  VolumeTypeTemporaryMemory,
  workloadTypeServer,
  workloadTypeCronjob,
  workloadTypeDaemonSet,
  workloadTypeStatefulSet,
  VolumeTypeHostPath,
  VolumeTypePersistentVolumeClaimTemplateNew,
  VolumeTypePersistentVolumeClaimTemplate,
} from "types/componentTemplate";
import { sizeStringToGi } from "utils/sizeConv";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Caption, H6 } from "widgets/Label";
import { RenderFormikSelectField } from "../Basic/select";
import { KRenderDebounceFormikTextField, RenderFormikComplexValueTextField } from "../Basic/textfield";
import { ValidatorRequired, ValidatorVolumeSize } from "../validator";

const mapStateToProps = (state: RootState) => {
  return {
    statefulSetOptions: state.get("persistentVolumes").get("statefulSetOptions"),
    simpleOptions: state.get("persistentVolumes").get("simpleOptions"),
    storageClasses: state.get("persistentVolumes").get("storageClasses"),
  };
};

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props extends FieldArrayRenderProps, FieldArrayProps {}

class RenderVolumesRaw extends React.PureComponent<Props> {
  private getUsingClaimNames() {
    const {
      form: { values },
      name,
    } = this.props;

    const claimNames: { [key: string]: boolean } = {};

    if (getIn(values, name)) {
      getIn(values, name).forEach((volume: VolumeContent, index: number) => {
        if (volume.type === VolumeTypePersistentVolumeClaim) {
          const claimName = volume.claimName;
          claimNames[claimName] = true;
        }
      });
    }

    return claimNames;
  }

  private isEdit = () => {
    const {
      form: { initialValues },
    } = this.props;
    let isEdit = false;
    if (initialValues && initialValues.name) {
      isEdit = true;
    }
    return isEdit;
  };

  private shouldDisabledStatefulSetPvcTemplate(fieldDiskType: string) {
    return this.isEdit() && fieldDiskType === VolumeTypePersistentVolumeClaimTemplate;
  }

  private getVolumeOptions = () => {
    const {
      form: { values },
      statefulSetOptions,
      simpleOptions,
    } = this.props;
    return values.workloadType === workloadTypeStatefulSet
      ? statefulSetOptions.filter((statefulSetOption) => statefulSetOption.get("componentName") === values.name)
      : simpleOptions;
  };

  private getClaimNameOptions(disk: VolumeContent) {
    const volumeOptions = this.getVolumeOptions();
    const usingClaimNames = this.getUsingClaimNames();
    const currentClaimName = disk.claimName;

    const options: {
      value: string;
      text: React.ReactNode;
      selectedText: string;
    }[] = [];

    volumeOptions.forEach((vo) => {
      if (vo.get("name") === currentClaimName || !usingClaimNames[vo.get("name")]) {
        options.push({
          value: vo.get("name"),
          text: (
            <Box pt={1} pb={1}>
              <H6>{vo.get("name")}</H6>
              <Box>
                {vo.get("componentNamespace") ? <Caption>Namespace: {vo.get("componentNamespace")}</Caption> : null}
              </Box>
              <Box>{vo.get("componentName") ? <Caption>Component: {vo.get("componentName")}</Caption> : null}</Box>
              <Box>
                <Caption>Storage Class: {vo.get("storageClassName")}</Caption>
              </Box>
              <Box>
                <Caption>size: {sizeStringToGi(vo.get("capacity")) + " Gi"}</Caption>
              </Box>
            </Box>
          ),
          selectedText: vo.get("name"),
        });
      }
    });

    return options;
  }

  private getStorageClassesOptions() {
    const { storageClasses } = this.props;

    const options: {
      value: string;
      text: string;
    }[] = [];

    storageClasses.forEach((sc) => {
      options.push({
        value: sc.get("name"),
        text: sc.get("name"),
      });
    });

    return options;
  }

  private getTypeOptions(filedDiskType: string) {
    let options: { value: string; text: string }[] = [];
    const {
      form: { values },
    } = this.props;
    if (values.workloadType === workloadTypeServer) {
      options = [
        { value: VolumeTypePersistentVolumeClaimNew, text: "Create and mount disk" },
        { value: VolumeTypePersistentVolumeClaim, text: "Mount an existing disk" },
      ];
    } else if (values.workloadType === workloadTypeCronjob) {
      options = [];
    } else if (values.workloadType === workloadTypeDaemonSet) {
      options = [{ value: VolumeTypeHostPath, text: "Mount a hostPath disk" }];
    } else if (values.workloadType === workloadTypeStatefulSet) {
      if (this.isEdit()) {
        if (this.shouldDisabledStatefulSetPvcTemplate(filedDiskType)) {
          options = [{ value: VolumeTypePersistentVolumeClaimTemplate, text: "Mount an existing disk group" }];
        }
      } else {
        options = [
          { value: VolumeTypePersistentVolumeClaimTemplateNew, text: "Create and mount disk group" },
          { value: VolumeTypePersistentVolumeClaimTemplate, text: "Mount an existing disk group" },
        ];
      }
    }

    options.push({ value: VolumeTypeTemporaryDisk, text: "Mount a temporary disk" });
    options.push({ value: VolumeTypeTemporaryMemory, text: "Mount a temporary memory disk" });

    return options;
  }

  private getDefaultAddValues(): any {
    const {
      storageClasses,
      form: { values },
    } = this.props;

    if (values.workloadType === workloadTypeServer) {
      return {
        type: VolumeTypePersistentVolumeClaimNew,
        path: "",
        storageClassName: storageClasses.get(0)?.get("name") || "",
        size: "",
      };
    } else if (values.workloadType === workloadTypeCronjob) {
      return {
        type: VolumeTypeTemporaryDisk,
        path: "",
        size: "",
      };
    } else if (values.workloadType === workloadTypeDaemonSet) {
      return {
        type: VolumeTypeHostPath,
        path: "",
        hostPath: "",
      };
    } else if (values.workloadType === workloadTypeStatefulSet) {
      if (this.isEdit()) {
        return {
          type: VolumeTypeTemporaryDisk,
          path: "",
          size: "",
        };
      }
      return {
        type: VolumeTypePersistentVolumeClaimTemplateNew,
        path: "",
        storageClassName: storageClasses.get(0)?.get("name") || "",
        size: "",
      };
    }

    return {
      type: VolumeTypePersistentVolumeClaimNew,
      path: "",
      storageClassName: storageClasses.get(0)?.get("name") || "",
      size: "",
    };
  }

  public getFieldComponents(disk: VolumeContent, index: number) {
    const { name } = this.props;
    const volumeOptions = this.getVolumeOptions();
    const typeOptions = this.getTypeOptions(disk.type);
    const shouldDisabledStatefulSetPvcTemplate = this.shouldDisabledStatefulSetPvcTemplate(disk.type);

    const fieldComponents = [
      <Field
        name={`${name}.${index}.type`}
        component={RenderFormikSelectField}
        label="Type"
        validate={ValidatorRequired}
        placeholder="Select a volume type"
        // defaultValue={typeOptions[0].value}
        value={disk.type || typeOptions[0].value}
        options={typeOptions}
        disabled={shouldDisabledStatefulSetPvcTemplate}
      />,
      <Field
        component={KRenderDebounceFormikTextField}
        name={`${name}.${index}.path`}
        label="Mount Path"
        validate={ValidatorRequired}
      />,
    ];

    if (disk.type === VolumeTypePersistentVolumeClaim || disk.type === VolumeTypePersistentVolumeClaimTemplate) {
      const claimName = disk.claimName;
      const volumeOption = volumeOptions.find((vo) => vo.get("name") === claimName);

      fieldComponents.push(
        <Field
          name={`${name}.${index}.claimName`}
          component={RenderFormikSelectField}
          label="Claim Name"
          // validate={ValidatorRequired}
          placeholder="Select a Claim Name"
          options={this.getClaimNameOptions(disk)}
          disabled={shouldDisabledStatefulSetPvcTemplate}
        />,
      );
      // only for show info
      fieldComponents.push(
        <TextField
          fullWidth
          disabled
          label="Storage Class"
          value={volumeOption?.get("storageClassName") || ""}
          margin="dense"
          variant="outlined"
        />,
      );
      // only for show info
      fieldComponents.push(
        <TextField
          fullWidth
          disabled
          label="Size"
          value={volumeOption?.get("capacity") ? sizeStringToGi(volumeOption?.get("capacity")) + " Gi" : ""}
          margin="dense"
          variant="outlined"
        />,
      );
    } else if (
      disk.type === VolumeTypePersistentVolumeClaimNew ||
      disk.type === VolumeTypePersistentVolumeClaimTemplateNew
    ) {
      fieldComponents.push(
        <Field
          label="Storage Class"
          name={`${name}.${index}.storageClassName`}
          component={RenderFormikSelectField}
          placeholder="Select the type of your disk"
          options={this.getStorageClassesOptions()}
        />,
      );
      fieldComponents.push(
        <Field
          component={RenderFormikComplexValueTextField}
          name={`${name}.${index}.size`}
          label="Size"
          margin
          validate={ValidatorVolumeSize}
          endAdornment={this.getSizeEndAdornment()}
          format={(value: any) => {
            return !value ? "" : sizeStringToGi(value);
          }}
          parse={(value: any) => {
            return !value ? "" : value + "Gi";
          }}
        />,
      );
    } else if (disk.type === VolumeTypeHostPath) {
      fieldComponents.push(
        <Field
          component={KRenderDebounceFormikTextField}
          name={`${name}.${index}.hostPath`}
          label="Host Path"
          validate={ValidatorRequired}
        />,
      );
    } else {
      fieldComponents.push(
        <Field
          component={RenderFormikComplexValueTextField}
          name={`${name}.${index}.size`}
          label="Size"
          margin
          validate={ValidatorVolumeSize}
          endAdornment={this.getSizeEndAdornment()}
          format={(value: any) => {
            return !value ? "" : sizeStringToGi(value);
          }}
          parse={(value: any) => {
            return !value ? "" : value + "Gi";
          }}
        />,
      );
    }

    return fieldComponents;
  }

  private getSizeEndAdornment() {
    return (
      <KTooltip title={this.getSizeHelper()}>
        <Box display="flex" alignItems="center">
          <HelpIcon fontSize="small" style={{ cursor: "pointer", color: grey[700] }} />
          <Box ml={0.5}>Gi</Box>
        </Box>
      </KTooltip>
    );
  }

  private getSizeHelper() {
    return "Kalm uses Mi as the base unit of disk. 1 Gi equals 1024 Mi.";
  }

  public render() {
    const {
      name,
      push,
      remove,
      form: { values },
    } = this.props;

    return (
      <Box>
        <Box mb={2}>
          <Grid item xs>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => {
                push(this.getDefaultAddValues());
              }}
            >
              Add
            </Button>
            {/* {submitFailed && error && <span>{error}</span>} */}
          </Grid>
        </Box>
        {getIn(values, name) &&
          getIn(values, name).map((disk: VolumeContent, index: number) => {
            return (
              <Grid container spacing={2} key={index}>
                {this.getFieldComponents(disk, index).map((fieldComponent, fieldIndex) => {
                  return (
                    <Grid item xs={fieldIndex === 0 ? 3 : 2} key={`${name}-${fieldIndex}`}>
                      {fieldComponent}
                    </Grid>
                  );
                })}

                <Grid item xs={1}>
                  <IconButtonWithTooltip
                    tooltipPlacement="top"
                    tooltipTitle="Delete"
                    aria-label="delete"
                    disabled={this.shouldDisabledStatefulSetPvcTemplate(disk.type)}
                    onClick={() => remove(index)}
                  >
                    <DeleteIcon />
                  </IconButtonWithTooltip>
                </Grid>
              </Grid>
            );
          })}
      </Box>
    );
  }
}

const RenderVolumes = connect(mapStateToProps)(RenderVolumesRaw);

export const Disks = (props: any) => {
  return <FieldArray name="volumes" component={RenderVolumes} {...props} />;
};
