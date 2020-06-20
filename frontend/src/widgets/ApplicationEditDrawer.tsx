import { createStyles, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Theme } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import AddIcon from "@material-ui/icons/Add";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import RemoveIcon from "@material-ui/icons/Remove";
import { WithStyles, withStyles } from "@material-ui/styles";
import { push } from "connected-react-router";
import Immutable from "immutable";
import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { getFormSyncErrors, hasSubmitFailed } from "redux-form/immutable";
import { TDispatch } from "types";
import { deleteComponentAction } from "../actions/application";
import { BaseDrawer } from "../layout/BaseDrawer";
import { primaryBackgroud, primaryColor } from "../theme";
import { ApplicationComponent, ApplicationComponentDetails, ApplicationDetails } from "../types/application";
import { ConfirmDialog } from "./ConfirmDialog";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import { blinkTopProgressAction } from "../actions/settings";
import { newEmptyComponentLike } from "types/componentTemplate";

const componentInitialValues = newEmptyComponentLike();

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  const componentSyncErrors = getFormSyncErrors("componentLike")(state);
  const componentFormSubmitFailed = hasSubmitFailed("componentLike")(state);
  const hash = window.location.hash;
  const anchor = hash.replace("#", "");

  return {
    anchor,
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
    entity,
    componentSyncErrors,
    componentFormSubmitFailed,
  };
};

const styles = (theme: Theme) =>
  createStyles({
    listItem: {
      color: "#000000 !important",
      height: 40,

      "& > .MuiListItemIcon-root": {
        minWidth: 32,
      },
    },
    listItemSeleted: {
      backgroundColor: `${primaryBackgroud} !important`,
      borderRight: `4px solid ${primaryColor}`,
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: "#000000 !important",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: "4px",
    },
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
  application?: ApplicationDetails;
  currentComponent?: ApplicationComponent; // for add new component
}

interface State {
  selectededComponentIndex: number;
  isDeleteConfirmDialogOpen: boolean;
}

class ApplicationEditDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      selectededComponentIndex: 0,
      isDeleteConfirmDialogOpen: false,
    };
  }

  private pushRedirect(componentName?: string) {
    const { application, dispatch, anchor } = this.props;

    dispatch(push(`/applications/${application?.get("name")}/edit?component=${componentName || ""}#${anchor}`));
  }

  private handleClickComponent(component: ApplicationComponent, index: number) {
    blinkTopProgressAction();

    this.setState({
      selectededComponentIndex: index,
    });

    this.pushRedirect(component.get("name"));
  }

  private handleAdd() {
    this.handleClickComponent(componentInitialValues, this.props.application?.get("components").size as number);
  }

  private confirmDelete() {
    const { application, dispatch, currentComponent } = this.props;

    if (currentComponent) {
      if (!currentComponent.get("name")) {
        const { application } = this.props;

        this.pushRedirect(
          application
            ?.get("components")
            ?.get(0)
            ?.get("name"),
        );
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
        this.pushRedirect("");
      }
    }
  }

  private showDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
    });
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
    });
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen } = this.state;
    const { currentComponent } = this.props;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title={`Are you sure to delete this component${
          currentComponent && currentComponent.get("name") ? currentComponent.get("name") : ""
        }?`}
        content="You will lost this component, and this action is irrevocable."
        onAgree={() => this.confirmDelete()}
      />
    );
  };

  public componentDidMount() {
    const { application } = this.props;
    if (!application) {
      return;
    }

    let search = queryString.parse(window.location.search);
    if (search.component === undefined) {
      // default select
      if (application && application.get("components")?.get(0)) {
        this.handleClickComponent(application.get("components").get(0) as ApplicationComponent, 0);
      }
    } else if (search.component !== undefined) {
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
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.application && this.props.application) {
      // after create
      if (this.props.application.get("components")?.size - prevProps.application.get("components")?.size === 1) {
        // select new created item
        this.handleClickComponent(
          this.props.application.get("components")?.get(this.state.selectededComponentIndex) as ApplicationComponent,
          this.props.application.get("components")!.size - 1,
        );
      }
    }
  }

  private renderComponents() {
    const { application, currentComponent, classes } = this.props;

    if (!application) {
      return null;
    }

    let components: Immutable.List<ApplicationComponent>;
    // has components
    if (application.get("components") && application.get("components").size > 0) {
      // create new
      if (currentComponent && !currentComponent.get("name")) {
        components = application.get("components").push(currentComponent as ApplicationComponentDetails);
      } else {
        components = application.get("components");
      }
    } else {
      // not create component yet
      components = Immutable.List([componentInitialValues as ApplicationComponent]);
    }

    let selectededComponentIndex = this.state.selectededComponentIndex;
    // correct selected index
    if (application.get("components")) {
      if (selectededComponentIndex > application.get("components").size) {
        selectededComponentIndex = 0;
      } else if (selectededComponentIndex === application.get("components").size) {
        if (!(currentComponent && !currentComponent.get("name"))) {
          selectededComponentIndex = 0;
        }
      }
    }

    return components.map((component, index) => {
      return (
        <React.Fragment key={index}>
          <ListItem
            selected={selectededComponentIndex === index}
            className={classes.listItem}
            classes={{
              selected: classes.listItemSeleted,
            }}
            button
            onClick={() => {
              this.handleClickComponent(component, index);
            }}>
            <ListItemIcon>
              <FiberManualRecordIcon
                style={{ fontSize: 15 }}
                htmlColor={selectededComponentIndex === index ? primaryColor : grey[400]}
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
