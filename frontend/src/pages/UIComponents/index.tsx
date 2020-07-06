import { Box, createStyles, Link, Theme, Typography, WithStyles, withStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { BasePage } from "../BasePage";
import { RowItemBox } from "widgets/Box";
import { Body, BoldBody, Caption, H1, H2, H3, H4, H5, H6, Subtitle1, Subtitle2 } from "widgets/Label";
import { CustomizedButton, RaisedButton } from "widgets/Button";
import { DarkInfoPaper, LightInfoPaper, NormalInfoPaper } from "widgets/Paper";
import {
  ArrowBackIcon,
  ArrowDropDownIcon,
  CheckBoxIcon,
  CheckBoxOutlineBlankIcon,
  CheckCircleIcon,
  ClearIcon,
  DeleteIcon,
  ErrorIcon,
  FilterListIcon,
  HelpIcon,
  KalmConsoleIcon,
  KalmLogIcon,
} from "widgets/Icon";

const mapStateToProps = (state: RootState) => {
  return {
    nodes: state.get("nodes").get("nodes"),
    metrics: state.get("nodes").get("metrics"),
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3),
    },
    demoPaper: {
      width: 200,
      height: 200,
    },
  });

interface States {}

type Props = ReturnType<typeof mapStateToProps> & TDispatchProp & WithStyles<typeof styles>;

export class UIComponentsRaw extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    const { classes } = this.props;

    return (
      <BasePage>
        <Box className={classes.root}>
          <Box display="flex" flexDirection="column" alignItems="start">
            <RowItemBox>
              <H1>H1</H1>
              <H1>text-title-1 28px font-weight 500</H1>
            </RowItemBox>
            <RowItemBox>
              <H2>H2</H2>
              <H2>text-title-1-subtitle 20px font-weight 400</H2>
            </RowItemBox>
            <RowItemBox>
              <H3>H3</H3>
              <H3>text-title-2 18px font-weight 500</H3>
            </RowItemBox>
            <RowItemBox>
              <H4>H4</H4>
              <H4>text-title-3 18px font-weight 400</H4>
            </RowItemBox>
            <RowItemBox>
              <H5>H5</H5>
              <H5>text-title-4 15px font-weight 500</H5>
            </RowItemBox>
            <RowItemBox>
              <H6>H6</H6>
              <H6>text-title-5 15px font-weight 400</H6>
            </RowItemBox>
            <RowItemBox>
              <Subtitle1>Subtitle1</Subtitle1>
            </RowItemBox>
            <RowItemBox>
              <Subtitle2>Subtitle2</Subtitle2>
            </RowItemBox>
            <RowItemBox long>
              <Body>Body</Body>
              <Body>text-body 13px font-weight 400</Body>
              <Body>label-content 13px font-weight 400</Body>
              <Link>inline-text-link 13px font-weight 400</Link>
            </RowItemBox>
            <RowItemBox long>
              <BoldBody>BoldBody</BoldBody>
              <BoldBody>text-body-strong 13px font-weight 500</BoldBody>
              <BoldBody>label-content-selected 13px font-weight 500</BoldBody>
            </RowItemBox>
            <RowItemBox>
              <Typography variant="button">button</Typography>
              <Typography variant="button">button 13px font-weight 500</Typography>
            </RowItemBox>
            <RowItemBox long>
              <CustomizedButton>button 13px font-weight 500</CustomizedButton>
              <CustomizedButton color="primary">button 13px font-weight 500</CustomizedButton>
              <CustomizedButton disabled>button 13px font-weight 500</CustomizedButton>
            </RowItemBox>
            <RowItemBox long>
              <RaisedButton>button 13px font-weight 500</RaisedButton>
              <RaisedButton color="primary">button 13px font-weight 500</RaisedButton>
              <RaisedButton disabled>button 13px font-weight 500</RaisedButton>
            </RowItemBox>
            <RowItemBox>
              <Caption>caption</Caption>
              <Caption>caption</Caption>
            </RowItemBox>
            <RowItemBox>
              <Typography variant="overline">overline</Typography>
            </RowItemBox>
            <RowItemBox long>
              <LightInfoPaper elevation={2} className={classes.demoPaper}>
                <H3>LightInfoPaper</H3>
              </LightInfoPaper>
              <NormalInfoPaper elevation={1} className={classes.demoPaper}>
                <H3>NormalInfoPaper</H3>
              </NormalInfoPaper>
              <DarkInfoPaper elevation={0} className={classes.demoPaper}>
                <H3>DarkInfoPaper</H3>
              </DarkInfoPaper>
            </RowItemBox>
            <RowItemBox long>
              <LightInfoPaper variant="outlined" className={classes.demoPaper}>
                <H3>LightInfoPaper</H3>
              </LightInfoPaper>
              <NormalInfoPaper variant="outlined" className={classes.demoPaper}>
                <H3>NormalInfoPaper</H3>
              </NormalInfoPaper>
              <DarkInfoPaper variant="outlined" className={classes.demoPaper}>
                <H3>DarkInfoPaper</H3>
              </DarkInfoPaper>
            </RowItemBox>
            <RowItemBox long>
              <HelpIcon />
              <ArrowDropDownIcon />
              <CheckBoxIcon />
              <CheckBoxOutlineBlankIcon />
              <FilterListIcon />
              <ClearIcon />
              <DeleteIcon />
              <CheckCircleIcon />
              <ErrorIcon />
              <ArrowBackIcon />
              <KalmConsoleIcon />
              <KalmLogIcon />
            </RowItemBox>
          </Box>
        </Box>
      </BasePage>
    );
  }
}

export const UIComponentsPage = connect(mapStateToProps)(withStyles(styles)(UIComponentsRaw));
