import { Box, Button, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { deleteComponentAction } from "actions/component";
import { blinkTopProgressAction } from "actions/settings";
import { Expansion, ExpansionProps } from "forms/Route/expansion";
import { PodsTable } from "pages/Components/PodsTable";
import { ComponentStatus } from "pages/Components/Status";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Application, ApplicationComponentDetails } from "types/application";
import { WorkloadType } from "types/componentTemplate";
import { DangerButton } from "widgets/Button";
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

    component.get("pods").forEach((pod) => {
      if (pod.get("status") === "Succeeded" || pod.get("status") === "Running") {
        runningCount = runningCount + 1;
      }
    });

    return `${runningCount}/${component.get("pods").size}`;
  };

  private renderPods() {
    const { component, application } = this.props;

    return (
      <Expansion title="pods" defaultUnfold nested>
        <PodsTable
          activeNamespaceName={application.get("name")}
          pods={component.get("pods")}
          workloadType={component.get("workloadType") as WorkloadType}
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
            to={`/applications/${application.get("name")}/components/${component.get("name")}`}
          >
            View More Details
          </Button>

          <Button
            component={Link}
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            variant="outlined"
            to={`/applications/${application.get("name")}/components/${component.get("name")}/edit`}
          >
            Edit
          </Button>

          <DangerButton
            variant="outlined"
            style={{ marginRight: 20 }}
            size="small"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(deleteComponentAction(component.get("name"), application.get("name")));
            }}
          >
            Delete
          </DangerButton>
        </Box>
        <ComponentBrifeInfo component={component} activeNamespaceName={application.get("name")} />

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
                <ComponentStatus component={component} enableMarginRight />{" "}
                <Subtitle1>{component.get("name")}</Subtitle1>
              </Box>
            </Grid>
            <Grid item>
              <Box display="flex" flexDirection={"row"}>
                <Subtitle1>Pods: {this.getPodsNumber()}</Subtitle1>
              </Box>
            </Grid>
            <Grid item>
              <Subtitle1>{component.get("workloadType")}</Subtitle1>
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
