import { Box, createStyles, Tab, Tabs, Theme, Typography, withStyles } from "@material-ui/core";
import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";

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
      id={`scrollable-prevent-tabpanel-${index}`}
      aria-labelledby={`scrollable-prevent-tab-${index}`}
      {...other}>
      {value === index && <Box>{children}</Box>}
    </Typography>
  );
}

interface StyledTabsProps {
  value: number;
  onChange: (event: React.ChangeEvent<{}>, newValue: number) => void;
}

const StyledTabs = withStyles({
  indicator: {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "transparent",
    "& > div": {
      width: "100%",
      backgroundColor: "#635ee7"
    }
  }
})((props: StyledTabsProps) => <Tabs {...props} TabIndicatorProps={{ children: <div /> }} />);

interface StyledTabProps {
  label: string;
}

const StyledTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: "none",
      fontWeight: theme.typography.fontWeightRegular,
      fontSize: theme.typography.pxToRem(15),
      marginRight: theme.spacing(1),
      "&:focus": {
        opacity: 1
      }
    }
  })
)((props: StyledTabProps) => <Tab disableRipple {...props} />);

interface TabOption {
  title: string;
  content: string;
  language: string;
}

interface Props {
  tabOptions: TabOption[];
}

interface State {
  tabIndex: number;
}

export class TabDataView extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tabIndex: 0
    };
  }

  private handleChangeTab = (_event: React.ChangeEvent<{}>, newValue: number) => {
    this.setState({ tabIndex: newValue });
  };

  public render() {
    const { tabOptions } = this.props;
    const { tabIndex } = this.state;

    return (
      <div>
        <StyledTabs value={tabIndex} onChange={this.handleChangeTab} aria-label="styled tabs example">
          {tabOptions.map(x => {
            return <StyledTab label={x.title} key={x.title} />;
          })}
        </StyledTabs>
        {tabOptions.map((x, index) => {
          return (
            <TabPanel value={tabIndex} key={index}>
              <SyntaxHighlighter language={x.language} style={monokai} showLineNumbers>
                {x.content}
              </SyntaxHighlighter>
            </TabPanel>
          );
        })}
      </div>
    );
  }
}
