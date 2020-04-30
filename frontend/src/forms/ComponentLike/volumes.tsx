import { MenuItem } from "@material-ui/core";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { RootState } from "../../reducers";
import { getComponentVolumeType } from "../../selectors/component";
import {
  Volume,
  VolumeTypePersistentVolumeClaimExisting,
  VolumeTypePersistentVolumeClaimNew,
  VolumeTypeTemporaryDisk,
  VolumeTypeTemporaryMemory
} from "../../types/componentTemplate";
import { CustomTextField, RenderSelectField } from "../Basic";
import { FieldArrayWrapper } from "../Basic/FieldArrayWrapper";
import { ValidatorRequired } from "../validator";

const mapStateToProps = (state: RootState) => {
  return {};
};

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props extends WrappedFieldArrayProps<Volume>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderVolumes extends React.PureComponent<Props> {
  public getFieldComponents(member: string) {
    const volumeType = getComponentVolumeType(member);

    const fieldComponents = [
      <Field
        name={`${member}.type`}
        component={RenderSelectField}
        label="Type"
        validate={[ValidatorRequired]}
        placeholder="Select a volume type">
        <MenuItem value={VolumeTypePersistentVolumeClaimNew}>Create and mount disk</MenuItem>
        <MenuItem value={VolumeTypePersistentVolumeClaimExisting}>Mount an existing disk</MenuItem>
        <MenuItem value={VolumeTypeTemporaryDisk}>Mount a temporary Disk</MenuItem>
        <MenuItem value={VolumeTypeTemporaryMemory}>Mount a temporary memory Disk</MenuItem>
      </Field>,
      <CustomTextField name={`${member}.path`} label="Mount Path" margin validate={[ValidatorRequired]} />
    ];

    if (volumeType === VolumeTypePersistentVolumeClaimNew) {
      fieldComponents.push(
        <Field
          label="Storage Class"
          name={`${member}.storageClassName`}
          component={RenderSelectField}
          placeholder="Select the type of your disk">
          <MenuItem value={"standard"}>Storage Class 1</MenuItem>
          <MenuItem value={"standard"}>Storage Class 2</MenuItem>
          <MenuItem value={"standard"}>Storage Class 3</MenuItem>
        </Field>
      );
      fieldComponents.push(
        <CustomTextField name={`${member}.size`} label="Size" margin validate={[ValidatorRequired]} />
      );
    } else if (volumeType === VolumeTypePersistentVolumeClaimExisting) {
      fieldComponents.push(
        <Field
          label="Storage Class"
          name={`${member}.storageClassName`}
          component={RenderSelectField}
          placeholder="Select the type of your disk">
          <MenuItem value={"standard"}>Storage Class 1</MenuItem>
          <MenuItem value={"standard"}>Storage Class 2</MenuItem>
          <MenuItem value={"standard"}>Storage Class 3</MenuItem>
        </Field>
      );
    }

    return fieldComponents;
  }

  public render() {
    return (
      <FieldArrayWrapper
        getFieldComponents={(member: string) => this.getFieldComponents(member)}
        // onAdd={() => this.props.fields.push(Immutable.Map({}))}
        {...this.props}
      />
    );
  }
}

export const Volumes = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="volumes" component={RenderVolumes} {...props} />;
});
