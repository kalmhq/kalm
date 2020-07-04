import React from "react";
import { boolean } from "@storybook/addon-knobs";
import { Targets } from "widgets/Targets";
import { HttpRouteDestination } from "types/route";
import Immutable from "immutable";

export default {
  title: "Widgets/Targets",
  component: Targets,
};

const firstDestination: HttpRouteDestination = Immutable.Map({ host: "productpage", weight: 1 });
const secondDestination: HttpRouteDestination = Immutable.Map({ host: "productpage", weight: 1 });
const oneDestinationList: Immutable.List<HttpRouteDestination> = Immutable.List([firstDestination]);
const twoDestinationList: Immutable.List<HttpRouteDestination> = Immutable.List([firstDestination, secondDestination]);
const threeDestinationList: Immutable.List<HttpRouteDestination> = Immutable.List([
  firstDestination,
  secondDestination,
  secondDestination,
]);

export const OneDestinationTarget = () => {
  return <Targets activeNamespaceName={"activeNamespaceName"} destinations={oneDestinationList} />;
};

export const TwoDestinationsTarget = () => {
  return <Targets activeNamespaceName={"activeNamespaceName"} destinations={twoDestinationList} />;
};

export const ThreeDestinationsTarget = () => {
  return <Targets activeNamespaceName={"activeNamespaceName"} destinations={threeDestinationList} />;
};
