import { Component } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";

class ScrollToTopRaw extends Component<RouteComponentProps> {
  public componentDidUpdate(prevProps: RouteComponentProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0);
    }
  }

  public render = () => this.props.children;
}

export const ScrollToTop = withRouter(ScrollToTopRaw);
