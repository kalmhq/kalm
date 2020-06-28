import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { VerticalHeadTable } from "widgets/VerticalHeadTable";
import { ApplicationComponentDetails } from "types/application";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    // xxx: state.get("xxx").get("xxx"),
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {
  activeNamespaceName: string;
  component: ApplicationComponentDetails;
}

interface State {}

class ComponentBasicInfoRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    const { component, activeNamespaceName } = this.props;
    return (
      <VerticalHeadTable
        items={[
          {
            name: "Created At",
            content: "TODO",
          },
          { name: "Name", content: component.get("name") },
          { name: "Namespace", content: activeNamespaceName },
          { name: "Image", content: component.get("image") },
          { name: "Workload Type", content: component.get("workloadType") },
          { name: "Update Strategy", content: component.get("restartStrategy") },
          { name: "Pod Status", content: "TODO: Running: 1, Pending: 1, Error: 2" },
          { name: "CPU", content: "TODO: Running: 1, Pending: 1, Error: 2" },
          { name: "Memory", content: "TODO: Running: 1, Pending: 1, Error: 2" },
        ]}
      />
    );
  }
}

export const ComponentBasicInfo = withStyles(styles)(connect(mapStateToProps)(ComponentBasicInfoRaw));
