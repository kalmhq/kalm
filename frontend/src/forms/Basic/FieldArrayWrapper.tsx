import { Box, Button, Grid, Icon } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import Immutable from "immutable";
import React from "react";
import { WrappedFieldArrayProps } from "redux-form";
import { IconButtonWithTooltip } from "../../widgets/IconButtonWithTooltip";

interface FieldArrayComponentHackType {
  name: any;
  component: any;
  getFieldComponents: (member: string) => JSX.Element[];
  onAdd?: () => any;
}

interface FieldArrayProps {}

interface Props
  extends WrappedFieldArrayProps<Immutable.Map<string, any>>,
    FieldArrayComponentHackType,
    FieldArrayProps {}

export class FieldArrayWrapper extends React.PureComponent<Props> {
  public render() {
    const {
      fields,
      getFieldComponents,
      onAdd,
      meta: { error, submitFailed },
    } = this.props;

    return (
      <div style={{ width: "100%", position: "relative" }}>
        {/* <Button
          color="primary"
          size="large"
          style={{ position: "absolute", right: 0, top: fields.length === 0 ? -40 : -32 }}
          onClick={() => (onAdd ? onAdd() : fields.push(Immutable.Map({})))}>
          Add
        </Button> */}
        <Box mb={2}>
          <Grid item xs>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Icon>add</Icon>}
              size="small"
              onClick={() => (onAdd ? onAdd() : fields.push(Immutable.Map({})))}
            >
              Add
            </Button>
            {submitFailed && error && <span>{error}</span>}
          </Grid>
        </Box>

        {fields.map((member, index) => {
          const fieldComponents = getFieldComponents(member);

          return (
            <Grid container spacing={2} key={member}>
              {fieldComponents.map((fieldComponent, fieldIndex) => {
                return (
                  <Grid item xs key={fieldIndex}>
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
      </div>
    );
  }
}
