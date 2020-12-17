import { Box, createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { deleteComponentAction } from "actions/component";
import { setSuccessNotificationAction } from "actions/notification";
import { blinkTopProgressAction } from "actions/settings";
import { renderCopyableValue } from "pages/Components/InfoComponents";
import { PodsTable } from "pages/Components/PodsTable";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Application, ApplicationComponentDetails } from "types/application";
import { WorkloadType } from "types/componentTemplate";
import { Expansion, ExpansionProps } from "widgets/expansion";
import { EditIcon, KalmComponentsIcon, KalmViewListIcon } from "widgets/Icon";
import { IconLinkWithToolTip } from "widgets/IconButtonWithTooltip";
import { DeleteButtonWithConfirmPopover } from "widgets/IconWithPopover";
import { KRTable } from "widgets/KRTable";
import { Subtitle1 } from "widgets/Label";

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
  canEdit: boolean;
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
  private getKRTableColumns() {
    return [
      { Header: "", accessor: "componentName" },
      { Header: "Pods", accessor: "pods" },
      { Header: "Type", accessor: "type" },
      { Header: "Image", accessor: "image" },
      { Header: "Actions", accessor: "actions" },
    ];
  }

  private getKRTableData() {
    const { component, classes, dispatch } = this.props;
    const data: any[] = [];

    data.push({
      componentName: (
        <Box display={"flex"}>
          <Box className={classes.componentIcon} pr={2}>
            <KalmComponentsIcon fontSize={"default"} />
          </Box>
          <Box display="flex" minWidth={100}>
            <Subtitle1>{component.name}</Subtitle1>
          </Box>
        </Box>
      ),
      pods: this.getPodsNumber(),
      type: component.workloadType,
      image: renderCopyableValue(component.image, dispatch),
      actions: this.componentControls(),
    });

    return data;
  }

  private renderSummary() {
    return <KRTable outlined columns={this.getKRTableColumns()} data={this.getKRTableData()} />;
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
    const { component, application, canEdit } = this.props;

    return (
      <PodsTable
        activeNamespaceName={application.name}
        pods={component.pods}
        workloadType={component.workloadType as WorkloadType}
        canEdit={canEdit}
      />
    );
  }

  private componentControls = () => {
    const { component, application, dispatch, canEdit } = this.props;
    return (
      <Box pb={2} pt={2}>
        <IconLinkWithToolTip
          onClick={() => {
            blinkTopProgressAction();
          }}
          size="small"
          tooltipTitle="Details"
          to={`/applications/${application.name}/components/${component.name}`}
        >
          <KalmViewListIcon />
        </IconLinkWithToolTip>

        {canEdit ? (
          <IconLinkWithToolTip
            onClick={() => {
              blinkTopProgressAction();
            }}
            tooltipTitle="Edit"
            size="small"
            to={`/applications/${application.name}/components/${component.name}/edit`}
          >
            <EditIcon />
          </IconLinkWithToolTip>
        ) : null}

        {canEdit ? (
          <DeleteButtonWithConfirmPopover
            iconSize="small"
            popupId="delete-pod-popup"
            popupTitle="DELETE COMPONENT?"
            confirmedAction={async () => {
              await dispatch(deleteComponentAction(component.name, application.name));
              dispatch(setSuccessNotificationAction("Delete component successfully"));
            }}
          />
        ) : null}
      </Box>
    );
  };

  public render = () => {
    const { component, defaultUnfold } = this.props;

    if (!component) {
      return "no component";
    }

    return (
      <Expansion defaultUnfold={defaultUnfold} title={this.renderSummary()} high={true}>
        {this.renderPods()}
      </Expansion>
    );
  };
}

export const ComponentPanel = withStyles(styles)(connect(mapStateToProps)(ComponentPanelRaw));
