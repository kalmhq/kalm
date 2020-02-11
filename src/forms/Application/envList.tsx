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

export interface EnvListProps {
  title: string;
  envs: EnvItems;
  missingEnvs?: EnvItems;
  defaultOpen?: boolean;
}

interface State {
  open: boolean;
}

export class EnvList extends React.PureComponent<EnvListProps, State> {
  constructor(props: EnvListProps) {
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

  public componentDidMount() {
    console.log("mount");
  }

  public componentWillUnmount() {
    console.log("unmount");
  }

  // public shouldComponentUpdate(
  //   nextProps: EnvListProps,
  //   nextState: State
  // ): boolean {
  //   const envsNotChange = this.props.envs.equals(nextProps.envs);
  //   const noMissingEnvs = !this.props.missingEnvs && !nextProps.missingEnvs;
  //   const hasMissingEnvs = !!this.props.missingEnvs && !!nextProps.missingEnvs;

  //   const missingEnvsNotChange =
  //     noMissingEnvs ||
  //     (hasMissingEnvs && this.props.missingEnvs!.equals(nextProps.missingEnvs));

  //   return !envsNotChange || !missingEnvsNotChange;
  // }

  public render() {
    const { title, envs, missingEnvs } = this.props;
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
                    <Chip
                      label={env.get("name")}
                      color={this.isEnvMissing(env) ? "secondary" : "primary"}
                      size="small"
                    />
                    {this.isEnvMissing(env) ? " is Missing." : ""}
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
