import { createStyles, TextField, Theme, withStyles } from "@material-ui/core";
import { WithStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import React, { RefObject } from "react";
import { ITerminalOptions, Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { SearchAddon } from "xterm-addon-search";
import "xterm/css/xterm.css";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { XTERM_SEARCH_ZINDEX } from "layout/Constants";

interface XtermProps extends WithStyles<typeof xtermStyles> {
  show: boolean;
  initializedContent?: string;
  terminalOptions?: ITerminalOptions;
  termianlOnData?: (...args: any) => any;
  termianlOnBinary?: (...args: any) => any;
  terminalOnResize?: (...args: any) => any;
}

interface XtermState {
  showSearch: boolean;
  searchValue: string;
  isSearchFocused: boolean;
}

const xtermStyles = (theme: Theme) =>
  createStyles({
    root: {
      position: "relative",
      "& .terminal.xterm": {
        padding: 10,
      },
    },
    searchArea: {
      position: "absolute",
      top: 0,
      right: 0,
      padding: theme.spacing(1),
      zIndex: XTERM_SEARCH_ZINDEX,
      display: "flex",
      alignItems: "center",
      background: "#f1f1f1",
      borderBottomLeftRadius: "3px",
      "& .MuiInputBase-root": {
        background: "white",
        width: 250,
        marginRight: theme.spacing(1),
      },
    },
  });

export class XtermRaw extends React.PureComponent<XtermProps, XtermState> {
  private myRef: RefObject<HTMLDivElement>;
  public xterm: Terminal;
  public fitAddon: FitAddon;
  public searchAddon: SearchAddon;
  private shown: boolean = false;

  private searchInputRef: React.RefObject<HTMLInputElement> = React.createRef();

  constructor(props: any) {
    super(props);
    this.myRef = React.createRef();
    this.xterm = new Terminal(props.terminalOptions || {});

    this.fitAddon = new FitAddon();
    this.searchAddon = new SearchAddon();
    this.xterm.loadAddon(this.fitAddon);
    this.xterm.loadAddon(this.searchAddon);

    if (props.terminalOnResize) {
      this.xterm.onResize(props.terminalOnResize);
    }

    if (props.termianlOnData) {
      this.xterm.onData(props.termianlOnData);
    }

    if (props.termianlOnBinary) {
      this.xterm.onBinary(props.termianlOnBinary);
    }

    this.state = {
      showSearch: false,
      searchValue: "",
      isSearchFocused: false,
    };
  }

  componentDidUpdate(_prevProps: XtermProps, prevState: XtermState) {
    if (this.props.show) {
      if (!this.shown) {
        this.xterm.open(this.myRef.current!);
        this.shown = true;
      }

      this.fitAddon.fit();

      if (!this.state.isSearchFocused) {
        this.xterm.focus();
      }
    }

    if (!prevState.showSearch && this.state.showSearch) {
      this.searchInputRef.current!.focus();
      this.searchInputRef.current!.select();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.keyDownHander as any);
  }

  componentDidMount() {
    if (this.props.show) {
      this.shown = true;
      this.xterm.open(this.myRef.current!);
      if (this.props.initializedContent) {
        this.xterm.write(this.props.initializedContent);
      }
      this.fitAddon.fit();
    }

    window.addEventListener("keydown", this.keyDownHander as any);
  }

  keyDownHander = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!this.props.show) {
      return;
    }

    if (e.keyCode === 70 && (e.ctrlKey || e.metaKey)) {
      if (this.state.showSearch) {
        this.searchInputRef.current!.focus();
        this.searchInputRef.current!.select();
      } else {
        this.setState({ showSearch: true });
      }

      e.preventDefault();
    } else if (e.keyCode === 27) {
      this.closeSearch();
    }
  };

  closeSearch = () => {
    this.setState({ showSearch: false, isSearchFocused: false });
    this.xterm.focus();
  };

  renderSearchInput = () => {
    const { classes } = this.props;
    const { showSearch, searchValue } = this.state;

    if (!showSearch) {
      return null;
    }

    return (
      <div className={classes.searchArea}>
        <TextField
          autoFocus
          variant="outlined"
          placeholder="Search in terminal"
          size="small"
          onChange={this.onSearch}
          value={searchValue}
          onKeyDown={this.onSearchInputKeyDown}
          inputRef={this.searchInputRef}
          onFocus={() => {
            this.setState({ isSearchFocused: true });
          }}
          onBlur={() => {
            this.setState({ isSearchFocused: false });
          }}
        />
        <IconButtonWithTooltip tooltipTitle="Close" onClick={this.closeSearch}>
          <CloseIcon />
        </IconButtonWithTooltip>
      </div>
    );
  };

  onSearchInputKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13) {
      this.searchAddon.findNext(this.state.searchValue, { caseSensitive: false, incremental: false });
    } else if (e.keyCode === 27) {
      this.closeSearch();
    }
  };

  onSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    this.setState({ searchValue: newValue });
    this.searchAddon.findNext(newValue, { caseSensitive: false, incremental: true });

    const selectionText = this.xterm.getSelection();
    if (selectionText.toLocaleLowerCase() !== newValue.toLocaleLowerCase()) {
      this.xterm.clearSelection();
    }
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        {this.renderSearchInput()}
        <div ref={this.myRef} style={{ height: 700 }}></div>
      </div>
    );
  }
}

export const Xterm = withStyles(xtermStyles)(XtermRaw);
