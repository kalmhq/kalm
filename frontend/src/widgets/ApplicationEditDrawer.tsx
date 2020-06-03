import { createStyles, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Theme } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import { WithStyles, withStyles } from "@material-ui/styles";
import Immutable from "immutable";
import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { getFormSyncErrors, hasSubmitFailed } from "redux-form/immutable";
import { TDispatch } from "types";
import { componentInitialValues } from "../forms/ComponentLike";
import { BaseDrawer } from "../layout/BaseDrawer";
import { primaryBackgroud, primaryColor } from "../theme";
import { ApplicationComponent, ApplicationComponentDetails, ApplicationDetails } from "../types/application";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import { deleteComponentAction } from "../actions/application";
import { ConfirmDialog } from "./ConfirmDialog";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  const componentSyncErrors = getFormSyncErrors("componentLike")(state);
  const componentFormSubmitFailed = hasSubmitFailed("componentLike")(state);

  return {
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
    entity,
    componentSyncErrors,
    componentFormSubmitFailed
  };
};

const styles = (theme: Theme) =>
  createStyles({
    listItem: {
      color: "#000000 !important",
      height: 40,

      "& > .MuiListItemIcon-root": {
        minWidth: 32
      }
    },
    listItemSeleted: {
      backgroundColor: `${primaryBackgroud} !important`,
      borderRight: `4px solid ${primaryColor}`
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: "#000000 !important",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: "4px"
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
  application?: ApplicationDetails;
  currentComponent?: ApplicationComponent; // for add new component

  handleClickComponent: (component?: ApplicationComponent) => void;
}

interface State {
  expandedComponentIndex: number;
  selectedListItemKey: string;
  isDeleteConfirmDialogOpen: boolean;
}

class ApplicationEditDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      expandedComponentIndex: 0,
      selectedListItemKey: this.generateComponentKey(0),
      isDeleteConfirmDialogOpen: false
    };
  }

  private handleClickComponent(component: ApplicationComponent, index: number) {
    this.setState({
      expandedComponentIndex: index,
      selectedListItemKey: this.generateComponentKey(index)
    });

    const { handleClickComponent } = this.props;
    handleClickComponent(component);
  }

  private handleAdd() {
    this.handleClickComponent(componentInitialValues, this.props.application?.get("components").size as number);
  }

  private confirmDelete() {
    const { application, dispatch } = this.props;

    const { currentComponent, handleClickComponent } = this.props;

    if (currentComponent) {
      if (!currentComponent.get("name")) {
        handleClickComponent(application?.get("components").get(0));
      } else {
        dispatch(deleteComponentAction(currentComponent.get("name")));
      }

      if (
        currentComponent.get("name") ===
        application
          ?.get("components")
          .get(0)
          ?.get("name")
      ) {
        handleClickComponent(undefined);
      }
    }
  }

  private showDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: true
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title="Are you sure to delete this component?"
        content="You will lost this component config, and this action is irrevocable."
        onAgree={this.confirmDelete}
      />
    );
  };

  private generateComponentKey(index: number): string {
    return `components-${index}`;
  }

  public componentDidMount() {
    const { application, handleClickComponent } = this.props;
    if (!application) {
      return;
    }

    let search = queryString.parse(window.location.search);
    if (search.component !== undefined) {
      if (search.component === "") {
        // new component form list
        if (application.get("components").size !== 0) {
          this.handleClickComponent(componentInitialValues as ApplicationComponent, application.get("components").size);
          return;
        }
      } else {
        // edit component form list
        const component = application.get("components").find(c => c.get("name") === search.component);
        const componentIndex = application.get("components").findIndex(c => c.get("name") === search.component);
        if (component) {
          this.handleClickComponent(component, componentIndex);
          return;
        }
      }
    }

    // default select
    if (application && application.get("components")?.get(0)) {
      handleClickComponent(application.get("components").get(0) as ApplicationComponent);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.application && this.props.application) {
      // after create
      if (this.props.application.get("components")?.size - prevProps.application.get("components")?.size === 1) {
        // select new created item
        this.handleClickComponent(
          this.props.application.get("components")?.get(this.state.expandedComponentIndex) as ApplicationComponent,
          this.props.application.get("components")!.size - 1
        );
      }
    }
  }

  private renderComponents() {
    const { application, classes } = this.props;

    if (!application) {
      return null;
    }

    let components: Immutable.List<ApplicationComponent>;
    if (application.get("components") && application.get("components").size > 0) {
      if (this.props.currentComponent && !this.props.currentComponent.get("name")) {
        components = application.get("components").push(this.props.currentComponent as ApplicationComponentDetails);
      } else {
        components = application.get("components");
      }
    } else {
      components = Immutable.List([componentInitialValues as ApplicationComponent]);
    }

    let expandedComponentIndex = this.state.expandedComponentIndex;
    let selectedListItemKey = this.state.selectedListItemKey;
    if (application.get("components")) {
      if (expandedComponentIndex > application.get("components").size) {
        expandedComponentIndex = 0;
        selectedListItemKey = this.generateComponentKey(0);
      } else if (expandedComponentIndex === application.get("components").size) {
        if (this.props.currentComponent && !this.props.currentComponent.get("name")) {
        } else {
          expandedComponentIndex = 0;
          selectedListItemKey = this.generateComponentKey(0);
        }
      }
    }

    return components.map((component, index) => {
      return (
        <React.Fragment key={index}>
          <ListItem
            selected={selectedListItemKey === this.generateComponentKey(index)}
            className={classes.listItem}
            classes={{
              selected: classes.listItemSeleted
            }}
            button
            onClick={() => {
              this.handleClickComponent(component, index);
            }}>
            <ListItemIcon>
              <FiberManualRecordIcon
                style={{ fontSize: 15 }}
                htmlColor={selectedListItemKey === this.generateComponentKey(index) ? primaryColor : grey[400]}
              />
            </ListItemIcon>
            <ListItemText primary={component.get("name") || `Please type component name`} />
          </ListItem>
        </React.Fragment>
      );
    });
  }

  render() {
    const { classes, application, currentComponent } = this.props;

    if (!application) {
      return null;
    }

    const disableAdd = (currentComponent && !currentComponent.get("name")) || application.get("components")?.size === 0;
    const disableDelete = !currentComponent || !currentComponent.get("name");

    return (
      <BaseDrawer>
        {this.renderDeleteConfirmDialog()}
        <List>
          <ListSubheader disableSticky={true} className={classes.listSubHeader}>
            Components
            <div>
              <IconButtonWithTooltip
                size="small"
                tooltipTitle={"Add"}
                aria-label="add component"
                disabled={disableAdd}
                onClick={() => this.handleAdd()}>
                <AddIcon />
              </IconButtonWithTooltip>
              <IconButtonWithTooltip
                size="small"
                tooltipTitle={"Delete"}
                aria-label="delete component"
                disabled={disableDelete}
                onClick={() => this.showDeleteConfirmDialog()}>
                <RemoveIcon />
              </IconButtonWithTooltip>
            </div>
          </ListSubheader>

          {this.renderComponents()}
        </List>
      </BaseDrawer>
    );
  }
}

export const ApplicationEditDrawer = connect(mapStateToProps)(withStyles(styles)(ApplicationEditDrawerRaw));
