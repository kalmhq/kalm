import { Box, Button, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { deleteComponentAction } from "actions/component";
import { setSuccessNotificationAction } from "actions/notification";
import { PodsTable } from "pages/Components/PodsTable";
import { ComponentStatus } from "pages/Components/Status";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Application, ApplicationComponentDetails } from "types/application";
import { WorkloadType } from "types/componentTemplate";
import { Expansion, ExpansionProps } from "widgets/expansion";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { Subtitle1 } from "widgets/Label";
import { ComponentBrifeInfo } from "./BrifeInfo";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    flexWrapper: {
      display: "flex",
      alignItems: "center",
    },
    componentContainer: {
      // background: "#f5f5f5",
      width: "100%",
    },
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props
  extends WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp,
    Pick<ExpansionProps, "defaultUnfold"> {
  application: Application;
  component: ApplicationComponentDetails;
}

interface State {}

class ComponentPanelRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private getPodsNumber = (): string => {
    const { component } = this.props;
    let runningCount = 0;

    component.pods?.forEach((pod) => {
      if (pod.status === "Succeeded" || pod.status === "Running") {
        runningCount = runningCount + 1;
      }
    });

    return `${runningCount}/${component.pods.length}`;
  };

  private renderPods() {
    const { component, application } = this.props;

    return (
      <Expansion title="pods" defaultUnfold nested>
        <PodsTable
          activeNamespaceName={application.name}
          pods={component.pods}
          workloadType={component.workloadType as WorkloadType}
        />
      </Expansion>
    );
  }

  private renderComponentDetail = () => {
    const { application, dispatch, component } = this.props;
    return (
      <Box display="flex" flexDirection="column" width={1}>
        <Box pb={2} pt={2}>
          <Button
            component={Link}
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            variant="outlined"
            to={`/applications/${application.name}/components/${component.name}`}
          >
            View More Details
          </Button>

          <Button
            component={Link}
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            variant="outlined"
            to={`/applications/${application.name}/components/${component.name}/edit`}
          >
            Edit
          </Button>

          <DeleteButtonWithConfirmPopover
            useText
            popupId="delete-component-popup"
            popupTitle="DELETE COMPONENT?"
            confirmedAction={async () => {
              await dispatch(deleteComponentAction(component.name, application.name));
              dispatch(setSuccessNotificationAction("Delete component successfully"));
            }}
          />
        </Box>
        <ComponentBrifeInfo component={component} activeNamespaceName={application.name} />

        {this.renderPods()}
      </Box>
    );
  };

  public render = () => {
    const { component, defaultUnfold } = this.props;

    if (!component) {
      return "no component";
    }

    return (
      <Expansion
        defaultUnfold={defaultUnfold}
        title={
          <Grid container spacing={2}>
            <Grid item>
              <Box display="flex" minWidth={200}>
                <ComponentStatus component={component} enableMarginRight /> <Subtitle1>{component.name}</Subtitle1>
              </Box>
            </Grid>
            <Grid item>
              <Box display="flex" flexDirection={"row"}>
                <Subtitle1>Pods: {this.getPodsNumber()}</Subtitle1>
              </Box>
            </Grid>
            <Grid item>
              <Subtitle1>{component.workloadType}</Subtitle1>
            </Grid>
          </Grid>
        }
      >
        {this.renderComponentDetail()}
      </Expansion>
    );
  };
}

export const ComponentPanel = withStyles(styles)(connect(mapStateToProps)(ComponentPanelRaw));
