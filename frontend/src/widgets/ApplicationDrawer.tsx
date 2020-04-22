import {
  createStyles,
  Theme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Collapse
} from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { blue } from "@material-ui/core/colors";
import { BaseDrawer } from "../layout/BaseDrawer";
import { ApplicationDetails, ApplicationComponent } from "../types/application";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  return {
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
    entity
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
      backgroundColor: `${blue[50]} !important`,
      borderRight: `4px solid ${blue[700]}`
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: "#000000 !important"
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
  application?: ApplicationDetails;
}

interface State {
  expandedComponentIndexes: { [key: string]: boolean };
  selectedListItemKey: string;
}

class ApplicationDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = { expandedComponentIndexes: {}, selectedListItemKey: "" };
  }

  private handleClickComponent(index: number) {
    const newIndexes = { ...this.state.expandedComponentIndexes };
    newIndexes[`${index}`] = !newIndexes[`${index}`];
    this.setState({
      expandedComponentIndexes: newIndexes
    });
  }

  private getComponentFields() {
    return [
      {
        key: "envs",
        text: "Environment variables"
      },
      {
        key: "ports",
        text: "Ports"
      },
      {
        key: "resources",
        text: "Resources"
      },
      {
        key: "plugins",
        text: "Plugins"
      },
      {
        key: "probes",
        text: "Probes"
      },
      {
        key: "advanced",
        text: "Advanced"
      }
    ];
  }

  private renderComponentFields(component: ApplicationComponent, index: number) {
    const { classes } = this.props;
    const fields = this.getComponentFields();
    return fields.map(field => {
      const key = `components-${index}-${field.key}`;
      return (
        <ListItem
          key={key}
          onClick={() => this.setState({ selectedListItemKey: key })}
          selected={this.state.selectedListItemKey === key}
          className={classes.listItem}
          classes={{
            selected: classes.listItemSeleted
          }}
          style={{
            paddingLeft: 48
          }}
          button>
          <ListItemIcon>
            <FiberManualRecordIcon style={{ fontSize: 15 }} htmlColor={blue[700]} />
          </ListItemIcon>
          <ListItemText primary={field.text} />
        </ListItem>
      );
    });
  }

  private renderComponents() {
    const { application, classes } = this.props;

    if (!application) {
      return null;
    }

    return application.get("components").map((component, index) => {
      return (
        <>
          <ListItem
            className={classes.listItem}
            classes={{
              selected: classes.listItemSeleted
            }}
            button
            onClick={() => {
              this.handleClickComponent(index);
            }}>
            <ListItemIcon>
              <FiberManualRecordIcon style={{ fontSize: 15 }} htmlColor={blue[700]} />
            </ListItemIcon>
            <ListItemText primary={component.get("name")} />
            {this.state.expandedComponentIndexes[`${index}`] ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={this.state.expandedComponentIndexes[`${index}`]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {this.renderComponentFields(component, index)}
            </List>
          </Collapse>
        </>
      );
    });
  }

  render() {
    const { classes, application } = this.props;

    if (!application) {
      return null;
    }

    return (
      <BaseDrawer>
        <List>
          <ListItem
            key={"baisc"}
            onClick={() => this.setState({ selectedListItemKey: "baisc" })}
            selected={this.state.selectedListItemKey === "baisc"}
            className={classes.listItem}
            classes={{
              selected: classes.listItemSeleted
            }}
            button>
            <ListItemIcon>
              <FiberManualRecordIcon style={{ fontSize: 15 }} htmlColor={blue[700]} />
            </ListItemIcon>
            <ListItemText primary={"Application Basic"} />
          </ListItem>

          <ListSubheader className={classes.listSubHeader}>Components</ListSubheader>

          {this.renderComponents()}

          <ListSubheader className={classes.listSubHeader}>Shared Environments</ListSubheader>

          <ListItem
            key={"sharedEnvs"}
            onClick={() => this.setState({ selectedListItemKey: "sharedEnvs" })}
            selected={this.state.selectedListItemKey === "sharedEnvs"}
            className={classes.listItem}
            classes={{
              selected: classes.listItemSeleted
            }}
            button>
            <ListItemIcon>
              <FiberManualRecordIcon style={{ fontSize: 15 }} htmlColor={blue[700]} />
            </ListItemIcon>
            <ListItemText primary={"Shared Environments"} />
          </ListItem>
        </List>
      </BaseDrawer>
    );
  }
}

export const ApplicationDrawer = connect(mapStateToProps)(withStyles(styles)(ApplicationDrawerRaw));
