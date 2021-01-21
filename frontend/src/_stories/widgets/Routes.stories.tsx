import React from "react";
import { HttpRouteDestination } from "types/route";
import { Targets } from "widgets/Targets";

export default {
  title: "Widgets/Targets",
  component: Targets,
};

const firstDestination: HttpRouteDestination = { host: "productpage", weight: 1 };
const secondDestination: HttpRouteDestination = { host: "productpage", weight: 1 };
const oneDestinationList: HttpRouteDestination[] = [firstDestination];
const twoDestinationList: HttpRouteDestination[] = [firstDestination, secondDestination];
const threeDestinationList: HttpRouteDestination[] = [firstDestination, secondDestination, secondDestination];

export const OneDestinationTarget = () => {
  return <Targets destinations={oneDestinationList} destinationsStatus={[]} />;
};

export const TwoDestinationsTarget = () => {
  return <Targets destinations={twoDestinationList} destinationsStatus={[]} />;
};

export const ThreeDestinationsTarget = () => {
  return <Targets destinations={threeDestinationList} destinationsStatus={[]} />;
};
