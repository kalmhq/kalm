import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { push } from "connected-react-router";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { ApplicationViewDrawer } from "widgets/ApplicationViewDrawer";
import { CustomizedButton } from "widgets/Button";
import { H4 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import { loadCertificates } from "actions/certificate";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
    secondHeaderRight: {
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center"
    },
    secondHeaderRightItem: {
      marginLeft: 20
    }
  });

const mapStateToProps = (state: RootState) => {
  return {
    isLoading: state.get("certificates").get("isLoading"),
    isFirstLoaded: state.get("certificates").get("isFirstLoaded"),
    certificates: state.get("certificates").get("certificates")
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class CertificateListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.dispatch(loadCertificates());
  }

  public render() {
    const { classes, dispatch, isFirstLoaded, isLoading } = this.props;
    return (
      <BasePage
        leftDrawer={<ApplicationViewDrawer />}
        secondHeaderRight={
          <div className={classes.secondHeaderRight}>
            <H4 className={classes.secondHeaderRightItem}>Routes</H4>
            <CustomizedButton
              color="primary"
              size="large"
              className={classes.secondHeaderRightItem}
              onClick={() => {
                dispatch(push(`/certificate/new`));
              }}>
              Add
            </CustomizedButton>
          </div>
        }>
        <div className={classes.root}>{isLoading && !isFirstLoaded ? <Loading /> : <div />}</div>
      </BasePage>
    );
  }
}

export const CertificateListPage = withStyles(styles)(connect(mapStateToProps)(CertificateListPageRaw));
