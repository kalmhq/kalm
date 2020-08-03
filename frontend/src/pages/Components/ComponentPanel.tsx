import { Box, Button, Container, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { deleteComponentAction } from "actions/component";
import { blinkTopProgressAction } from "actions/settings";
import { Expansion, ExpansionProps } from "forms/Route/expansion";
import { PodsTable } from "pages/Components/PodsTable";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Application, ApplicationComponentDetails } from "types/application";
import { WorkloadType } from "types/componentTemplate";
import { DangerButton } from "widgets/Button";
import { Subtitle1, Caption } from "widgets/Label";
import { KalmComponentsIcon } from "widgets/Icon";

const styles = (theme: Theme) =>
  createStyles({
    componentTitleRow: {
      paddingTop: 8,
      alignItems: "center",
    },
    componentIcon: {
      height: "1.25rem",
      color: theme.palette.type === "light" ? theme.palette.primary.light : "#FFFFFF",
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

/**
 * A Panel which shows a brief overview of an Application Component
 */
class ComponentPanelRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderSummary(component: ApplicationComponentDetails) {
    const { classes } = this.props;
    return (
      <Container>
        <Grid container className={classes.componentTitleRow} spacing={2}>
          <Grid item xs={3}>
            <Box display={"flex"}>
              <Box className={classes.componentIcon} pr={2}>
                <KalmComponentsIcon fontSize={"default"} />
              </Box>
              <Box display="flex" minWidth={200}>
                <Subtitle1>{component.get("name")}</Subtitle1>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={8}>
            <Grid container spacing={10} justify={"flex-start"}>
              <Grid item>
                <Caption>Pods</Caption>
                <Subtitle1>{this.getPodsNumber()}</Subtitle1>
              </Grid>
              <Grid item>
                <Caption>Type</Caption>
                <Subtitle1>{component.get("workloadType")}</Subtitle1>
              </Grid>
              <Grid item>
                <Caption>Image</Caption>
                <Subtitle1>{component.get("image")}</Subtitle1>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid>{this.componentControls()}</Grid>
      </Container>
    );
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
      <PodsTable
        activeNamespaceName={application.get("name")}
        pods={component.get("pods")}
        workloadType={component.get("workloadType") as WorkloadType}
      />
    );
  }

  private componentControls = () => {
    const { component, application, dispatch } = this.props;
    return (
      <Box pb={2} pt={2}>
        <Button
          component={Link}
          style={{ marginRight: 20 }}
          color="primary"
          size="small"
          variant="outlined"
          to={`/applications/${application.get("name")}/components/${component.get("name")}`}
        >
          View Details
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
    );
  };

  public render = () => {
    const { component, defaultUnfold } = this.props;

    if (!component) {
      return "no component";
    }

    return (
      <Expansion defaultUnfold={defaultUnfold} title={this.renderSummary(component)}>
        {this.renderPods()}
      </Expansion>
    );
  };
}

export const ComponentPanel = withStyles(styles)(connect(mapStateToProps)(ComponentPanelRaw));
