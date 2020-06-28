import { Box, Button, createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import { deleteComponentAction } from "actions/application";
import { blinkTopProgressAction } from "actions/settings";
import { Expansion, ExpansionProps } from "forms/Route/expansion";
import { ComponentBasicInfo } from "pages/Components/BasicInfo";
import { PodsTable } from "pages/Components/PodsTable";
import { ComponentStatus } from "pages/Components/Status";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Application, ApplicationComponentDetails } from "types/application";
import { H5 } from "widgets/Label";

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
  return {
    // xxx: state.get("xxx").get("xxx"),
  };
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

  private renderComponentDetail = () => {
    const { application, dispatch, component } = this.props;
    return (
      <Box display="flex" flexDirection="column" width={1}>
        <Box pb={2} pt={2}>
          <Button
            component={(props: any) => <Link {...props} />}
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            variant="outlined"
            to={`/applications/${application.get("name")}/components/${component.get("name")}`}
          >
            View More Details
          </Button>

          <Button
            component={(props: any) => <Link {...props} />}
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            variant="outlined"
            to={`/applications/${application.get("name")}/components/${component.get("name")}/edit`}
          >
            Edit
          </Button>

          <Button
            variant="outlined"
            style={{ marginRight: 20 }}
            color="primary"
            size="small"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(deleteComponentAction(component.get("name"), application.get("name")));
            }}
          >
            Delete
          </Button>
        </Box>
        <ComponentBasicInfo component={component} activeNamespaceName={application.get("name")} />

        <Box pt={2} pb={2}>
          <PodsTable activeNamespaceName={application.get("name")} pods={component.get("pods")} />
        </Box>
      </Box>
    );
  };

  public render = () => {
    const { component, defaultUnfold } = this.props;

    return (
      <Expansion
        defaultUnfold={defaultUnfold}
        title={
          <Grid container spacing={2}>
            <Grid item md={2}>
              <Box display="flex">
                <ComponentStatus component={component} enableMarginRight /> <H5>{component.get("name")}</H5>
              </Box>
            </Grid>
            <Grid item md={2}>
              <span>Pods:</span> <span>{this.getPodsNumber()}</span>
            </Grid>
            <Grid item md={2}>
              {component.get("image")}
            </Grid>
            <Grid item md={2}>
              {component.get("workloadType")}
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
