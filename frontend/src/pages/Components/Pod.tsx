import React from "react";
import { Box, styled } from "@material-ui/core";
import { PodStatus } from "types/application";

const PodBox = styled(Box)({
  height: 10,
  width: 10,
  borderRadius: 5,
  margin: 2,
});

const PodRunningBox = styled(PodBox)({
  background: "green",
});

const PodStopBox = styled(PodBox)({
  background: "grey",
});

const PodErrorBox = styled(PodBox)({
  background: "red",
});

interface IPod {
  info: PodStatus;
  key: any;
}

export const getPod = ({ info, key }: IPod) => {
  switch (info.status) {
    case "Running":
      return <PodRunningBox key={key} />;
    case "Succeeded":
      return <PodRunningBox key={key} />;
    case "Failed":
      return <PodErrorBox key={key} />;
    default:
      return <PodStopBox key={key} />;
  }
};
