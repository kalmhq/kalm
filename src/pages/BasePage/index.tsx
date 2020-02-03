import React from "react";
import PageHeader from "../../widgets/PageHeader";

export interface BasePageProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export class BasePage extends React.PureComponent<BasePageProps> {
  public render() {
    return (
      <div className={this.props.className}>
        <PageHeader title={this.props.title}></PageHeader>
        {this.props.children}
      </div>
    );
  }
}
