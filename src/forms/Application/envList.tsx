import React from "react";
import {
  Collapse,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip
} from "@material-ui/core";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import { EnvItems, EnvItem } from "../../actions";
import { EnvTypeExternal, EnvTypeStatic } from "../Basic/env";

export interface Props {
  title: string;
  envs: EnvItems;
  sharedEnvs?: EnvItems;
  missingEnvs?: EnvItems;
  defaultOpen?: boolean;
}

interface State {
  open: boolean;
}

export class EnvList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      open: !!props.defaultOpen
    };
  }

  private handleClick = () => {
    this.setState({ open: !this.state.open });
  };

  private isEnvMissing = (env: EnvItem) => {
    const { missingEnvs } = this.props;
    return (
      !!missingEnvs &&
      !!missingEnvs?.find(x => x.get("name") === env.get("name"))
    );
  };

  private getEnvValue = (env: EnvItem) => {
    if (env.get("type") === EnvTypeStatic) {
      return env.get("value");
    }

    const { sharedEnvs } = this.props;
    if (env.get("type") === EnvTypeExternal && sharedEnvs) {
      return sharedEnvs
        .find(x => x.get("name") === env.get("name"))
        ?.get("value");
    }
  };

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    if (nextState.open !== this.state.open) {
      return true;
    }

    if (!this.props.envs.equals(nextProps.envs)) {
      return true;
    }

    if (this.props.defaultOpen !== nextProps.defaultOpen) {
      return true;
    }

    if (this.props.sharedEnvs) {
      if (!this.props.sharedEnvs.equals(nextProps.sharedEnvs)) {
        return true;
      }
    }

    if (this.props.missingEnvs) {
      if (!this.props.missingEnvs.equals(nextProps.missingEnvs)) {
        return true;
      }
    }
    return false;
  }

  public render() {
    const { title, envs, missingEnvs, sharedEnvs } = this.props;
    const { open } = this.state;
    return (
      <List
        dense
        component="nav"
        aria-labelledby="nested-list-subheader"
        disablePadding
      >
        <ListItem dense disableGutters button onClick={this.handleClick}>
          <ListItemText>
            {title}
            <Box
              color={
                missingEnvs && missingEnvs.size > 0
                  ? "secondary.main"
                  : "primary.main"
              }
              display="inline"
              ml={1}
            >
              {missingEnvs && missingEnvs.size > 0 ? (
                <strong>
                  {envs.size - missingEnvs.size} / {envs.size}
                </strong>
              ) : (
                <strong>{envs.size}</strong>
              )}
            </Box>
          </ListItemText>
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {envs.map(env => (
              <ListItem dense disableGutters key={env.get("name")}>
                <ListItemText>
                  <Box
                    color={
                      this.isEnvMissing(env) ? "secondary.main" : "primary.main"
                    }
                    display="inline"
                    mt={1}
                    ml={2}
                  >
                    <strong>{env.get("name")}</strong>:
                    {this.isEnvMissing(env)
                      ? " is Missing."
                      : this.getEnvValue(env)}
                  </Box>
                </ListItemText>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
    );
  }
}
