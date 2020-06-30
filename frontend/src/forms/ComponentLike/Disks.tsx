import { Box, Button, Grid, Icon, TextField } from "@material-ui/core";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { arrayPush, WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { getComponentFormVolumeClaimName, getComponentFormVolumeType } from "selectors/component";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { RootState } from "../../reducers";
import { getComponentFormVolumeOptions } from "../../selectors/component";
import {
  Volume,
  VolumeTypePersistentVolumeClaim,
  VolumeTypePersistentVolumeClaimNew,
  VolumeTypeTemporaryDisk,
  VolumeTypeTemporaryMemory,
} from "../../types/componentTemplate";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField } from "../Basic/textfield";
import { ValidatorRequired, ValidatorVolumeSize } from "../validator";

const mapStateToProps = (state: RootState) => {
  return {
    volumeOptions: getComponentFormVolumeOptions(),
    storageClasses: state.get("persistentVolumes").get("storageClasses"),
  };
};

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props extends WrappedFieldArrayProps<Volume>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderVolumes extends React.PureComponent<Props> {
  private getUsingClaimNames() {
    const { fields } = this.props;

    const claimNames: { [key: string]: boolean } = {};

    fields.forEach((member) => {
      const type = getComponentFormVolumeType(member);
      if (type === VolumeTypePersistentVolumeClaim) {
        const claimName = getComponentFormVolumeClaimName(member);
        claimNames[claimName] = true;
      }
    });

    return claimNames;
  }

  private getClaimNameOptions(currentMember: string) {
    const { volumeOptions } = this.props;
    const usingClaimNames = this.getUsingClaimNames();
    const currentClaimName = getComponentFormVolumeClaimName(currentMember);

    const options: {
      value: string;
      text: string;
    }[] = [];

    volumeOptions.forEach((vo) => {
      if (vo.get("name") === currentClaimName || !usingClaimNames[vo.get("name")]) {
        options.push({
          value: vo.get("name"),
          text: vo.get("name"),
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

  public getFieldComponents(member: string) {
    const volumeType = getComponentFormVolumeType(member);
    const { volumeOptions } = this.props;

    const fieldComponents = [
      <Field
        name={`${member}.type`}
        component={RenderSelectField}
        label="Type"
        validate={[ValidatorRequired]}
        placeholder="Select a volume type"
        defaultValue={VolumeTypePersistentVolumeClaimNew}
        options={[
          // { value: VolumeTypePersistentVolumeClaim, text: "Mount a disk" },
          { value: VolumeTypePersistentVolumeClaimNew, text: "Create and mount disk" },
          { value: VolumeTypePersistentVolumeClaim, text: "Mount an existing disk" },
          { value: VolumeTypeTemporaryDisk, text: "Mount a temporary disk" },
          { value: VolumeTypeTemporaryMemory, text: "Mount a temporary memory disk" },
        ]}
      ></Field>,
      <Field
        component={KRenderTextField}
        name={`${member}.path`}
        label="Mount Path"
        margin
        validate={[ValidatorRequired]}
      />,
    ];

    if (volumeType === VolumeTypePersistentVolumeClaim) {
      const claimName = getComponentFormVolumeClaimName(member);
      const volumeOption = volumeOptions.find((vo) => vo.get("name") === claimName);

      fieldComponents.push(
        <Field
          name={`${member}.claimName`}
          component={RenderSelectField}
          label="Claim Name"
          // validate={[ValidatorRequired]}
          placeholder="Select a Claim Name"
          options={this.getClaimNameOptions(member)}
        ></Field>,
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
          value={volumeOption?.get("capacity") || ""}
          margin="dense"
          variant="outlined"
        />,
      );
    } else if (volumeType === VolumeTypePersistentVolumeClaimNew) {
      fieldComponents.push(
        <Field
          label="Storage Class"
          name={`${member}.storageClassName`}
          component={RenderSelectField}
          placeholder="Select the type of your disk"
          options={this.getStorageClassesOptions()}
        ></Field>,
      );
      fieldComponents.push(
        <Field
          component={KRenderTextField}
          name={`${member}.size`}
          label="Size"
          margin
          validate={[ValidatorRequired, ValidatorVolumeSize]}
        />,
      );
    } else {
      fieldComponents.push(
        <Field
          component={KRenderTextField}
          name={`${member}.size`}
          label="Size"
          margin
          validate={[ValidatorRequired, ValidatorVolumeSize]}
        />,
      );
    }

    return fieldComponents;
  }

  public render() {
    const {
      fields,
      dispatch,
      storageClasses,
      meta: { submitFailed, error, form },
    } = this.props;

    return (
      <Box>
        <Box mb={2}>
          <Grid item xs>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Icon>add</Icon>}
              size="small"
              onClick={() => {
                dispatch(
                  arrayPush(
                    form,
                    fields.name,
                    Immutable.Map({
                      type: VolumeTypePersistentVolumeClaimNew,
                      storageClassName: storageClasses.get(0)?.get("name"),
                    }),
                  ),
                );
              }}
            >
              Add
            </Button>
            {submitFailed && error && <span>{error}</span>}
          </Grid>
        </Box>

        {fields.map((member, index) => {
          return (
            <Grid container spacing={2} key={member}>
              {this.getFieldComponents(member).map((fieldComponent, fieldIndex) => {
                return (
                  <Grid item xs key={`${member}-${fieldIndex}`}>
                    {fieldComponent}
                  </Grid>
                );
              })}

              <Grid item xs>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Delete"
                  aria-label="delete"
                  onClick={() => fields.remove(index)}
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

export const Disks = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="volumes" component={RenderVolumes} {...props} />;
});
