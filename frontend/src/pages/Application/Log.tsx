import { Chip, createStyles, Paper, TextField, Theme, withStyles } from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import { WithStyles } from "@material-ui/core/styles";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Typography from "@material-ui/core/Typography";
import { Autocomplete, AutocompleteProps, UseAutocompleteProps } from "@material-ui/lab";
import React, { RefObject } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { k8sWsPrefix } from "../../actions/kubernetesApi";
import { Breadcrumb } from "../../widgets/Breadcrumbs";
import { Loading } from "../../widgets/Loading";
import { ApplicationItemDataWrapper, WithApplicationsDataProps } from "./ItemDataWrapper";

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}>
      {children}
    </Typography>
  );
}

function a11yProps(index: any) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`
  };
}

const autocompleteStyles = (_theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      "& .MuiFormControl-root": {
        width: "100%",
        margin: "12px 0"
      }
    }
  });

const MyAutocomplete = withStyles(autocompleteStyles)(
  (props: AutocompleteProps<string> & UseAutocompleteProps<string>) => {
    return <Autocomplete {...props} />;
  }
);

class Xterm extends React.PureComponent<{ podName: string; show: boolean }> {
  private myRef: RefObject<HTMLDivElement>;
  public xterm: Terminal;
  public fitAddon: FitAddon;
  private shown: boolean = false;

  constructor(props: any) {
    super(props);
    this.myRef = React.createRef();
    this.xterm = new Terminal({
      cursorBlink: false,
      disableStdin: true,
      convertEol: true,
      // cols: 180,
      fontSize: 12
      // rendererType: "dom",
      // rows: 50
    });
    this.fitAddon = new FitAddon();
    this.xterm.loadAddon(this.fitAddon);
  }

  componentDidUpdate() {
    if (this.props.show) {
      if (!this.shown) {
        this.xterm.open(this.myRef.current!);
        this.shown = true;
      }

      this.fitAddon.fit();
    }
  }

  componentWillUnmount() {
    // console.log("umount");
  }

  componentDidMount() {
    if (this.props.show) {
      this.shown = true;
      this.xterm.open(this.myRef.current!);
      this.fitAddon.fit();
    }
  }

  render() {
    return <div ref={this.myRef} style={{ height: 700 }}></div>;
  }
}

interface Props extends WithApplicationsDataProps, WithStyles<typeof styles> {}

interface State {
  value: any;
  subscribedPodNames: Set<string>;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    paper: {
      padding: theme.spacing(2)
    }
  });

export class LogStream extends React.PureComponent<Props, State> {
  private ws: WebSocket;
  private terminals: Map<string, Xterm> = new Map();
  constructor(props: Props) {
    super(props);

    this.state = {
      value: "",
      subscribedPodNames: new Set()
    };

    this.ws = this.connectWs();
  }

  private saveTerminal = (name: string, el: Xterm | null) => {
    if (el) {
      this.terminals.set(name, el);
    } else {
      this.terminals.delete(name);
    }

    window.debug = this.terminals;
  };

  componentWillUnmount() {
    if (this.ws) {
      this.ws.close();
    }
  }

  connectWs = () => {
    const ws = new WebSocket(`${k8sWsPrefix}/v1alpha1/logs`);

    ws.onopen = evt => {
      ws.send(
        JSON.stringify({
          type: "authStatus",
          requestId: "checkAuthStatus"
        })
      );
    };

    ws.onmessage = evt => {
      // console.log("Received Message: " + evt.data);
      const data = JSON.parse(evt.data);
      if (data.type === "common") {
        if (data.requestId === "checkAuthStatus") {
          if (data.status === -1) {
            ws.send(
              JSON.stringify({
                type: "auth",
                requestId: "sendAuthToken",
                authToken: window.localStorage.AUTHORIZED_TOKEN_KEY
              })
            );
            // } else {
            //   doSubscribe();
          }
        } else if (data.requestId === "sendAuthToken") {
          if (data.status === -1) {
            // this.xterm.write(data.message);
            // } else {
            //   doSubscribe();
          }
        }
      } else if (data.type === "logStream") {
        const terminal = this.terminals.get(data.podName);
        if (terminal && terminal.xterm) {
          terminal.xterm.write(data.data);
        }
      }
    };

    ws.onclose = evt => {
      console.log("Connection closed.");
    };

    return ws;
  };

  subscribe = (podName: string) => {
    const { namespace } = this.props;
    this.ws.send(
      JSON.stringify({
        type: "subscribePodLog",
        requestID: "sub-" + podName,
        podName: podName,
        namespace: namespace
      })
    );
  };

  unsubscribe = (podName: string) => {
    const { namespace } = this.props;
    this.ws.send(
      JSON.stringify({
        type: "unsubscribePodLog",
        requestID: "sub-" + podName,
        podName: podName,
        namespace: namespace
      })
    );
  };

  onInputChange = (event: React.ChangeEvent<{}>, x: string[]) => {
    const currentSet = new Set(x);
    const needSub = Array.from(currentSet).filter(x => !this.state.subscribedPodNames.has(x));
    const needUnsub = Array.from(this.state.subscribedPodNames).filter(x => !currentSet.has(x));
    const intersection = Array.from(currentSet).filter(x => this.state.subscribedPodNames.has(x));

    needSub.forEach(this.subscribe);
    needUnsub.forEach(this.unsubscribe);

    const { value } = this.state;
    let newValue = value;
    if (needUnsub.includes(value)) {
      if (needSub.length > 0) {
        newValue = needSub[0];
      } else if (intersection.length > 0) {
        newValue = intersection[0];
      } else {
        newValue = "";
      }
    } else if (value === "" && needSub.length > 0) {
      newValue = needSub[0];
    } else if (needSub.length === 1 && needUnsub.length === 0) {
      newValue = needSub[0];
    }

    this.setState({ subscribedPodNames: currentSet, value: newValue });
  };

  private renderInput() {
    const { podNames } = this.props;
    const { value } = this.state;
    const names = podNames!.toArray();

    return (
      <MyAutocomplete
        multiple
        id="tags-filled"
        options={names}
        onChange={this.onInputChange}
        // defaultValue={[names[0]]}
        renderTags={(options: string[], getTagProps) =>
          options.map((option: string, index: number) => {
            return (
              <Chip
                variant="outlined"
                label={option}
                size="small"
                color={option === value ? "primary" : "default"}
                {...getTagProps({ index })}
              />
            );
          })
        }
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            label="Select the pod you want to view logs"
            size="small"
            placeholder="Select the pod you want to view logs"
          />
        )}
      />
    );
  }

  private handleChange = (event: React.ChangeEvent<{}>, newValue: any) => {
    this.setState({ value: newValue });
  };

  public render() {
    const { isLoading, application, classes } = this.props;
    const { value, subscribedPodNames } = this.state;

    return (
      <Paper elevation={2} classes={{ root: classes.paper }}>
        <Breadcrumb />
        {isLoading || !application ? (
          <Loading />
        ) : (
          <>
            {this.renderInput()}
            {/* <div className={classes.root}> */}
            <div>
              {Array.from(subscribedPodNames).length > 0 ? (
                <AppBar position="static" color="default">
                  <Tabs
                    value={value}
                    onChange={this.handleChange}
                    aria-label="simple tabs example"
                    variant="scrollable">
                    {Array.from(subscribedPodNames).map(x => (
                      <Tab label={x} key={x} value={x} {...a11yProps(x)} />
                    ))}
                  </Tabs>
                </AppBar>
              ) : null}
              {Array.from(subscribedPodNames).map(x => {
                return (
                  <TabPanel value={value} key={x} index={x}>
                    <Xterm ref={el => this.saveTerminal(x, el)} podName={x} show={value === x} />
                  </TabPanel>
                );
              })}
            </div>
          </>
        )}
      </Paper>
    );
  }
}

export const Log = withStyles(styles)(ApplicationItemDataWrapper(LogStream));
