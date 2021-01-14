import React from "react";
import { ApplicationComponentDetails, PodStatus } from "types/application";
import { sizeStringToNumber } from "utils/sizeConv";
import { SmallCPULineChart, SmallMemoryLineChart } from "widgets/SmallLineChart";

interface ComponentProps {
  component: ApplicationComponentDetails;
}

export const ComponentMemoryChart: React.FC<ComponentProps> = ({ component }) => {
  if (!component.memoryLimit) {
    return null;
  }

  const metrics = component.metrics;
  const memoryLimit = sizeStringToNumber(component.memoryLimit!);
  const limit = component.replicas * memoryLimit;

  return (
    <SmallMemoryLineChart
      limit={limit}
      data={metrics && metrics.memory}
      hoverText={!!component.pods ? "" : "No data"}
    />
  );
};

export const ComponentCPUChart: React.FC<ComponentProps> = ({ component }) => {
  const metrics = component.metrics;

  if (!component.cpuLimit) {
    return null;
  }

  const cpuLimit = sizeStringToNumber(component.cpuLimit);
  const limit = component.replicas * cpuLimit * 1000; // metric data basic unit is 0.001 core

  return <SmallCPULineChart limit={limit} data={metrics && metrics.cpu} />;
};

interface PodProps extends ComponentProps {
  pod: PodStatus;
}

export const PodMemoryChart: React.FC<PodProps> = ({ pod, component }) => {
  if (!component.memoryLimit) {
    return null;
  }

  const metrics = pod.metrics;
  const memoryLimit = sizeStringToNumber(component.memoryLimit!);
  const limit = memoryLimit;

  return (
    <SmallMemoryLineChart
      limit={limit}
      data={metrics && metrics.memory}
      hoverText={!!component.pods ? "" : "No data"}
    />
  );
};

export const PodCPUChart: React.FC<PodProps> = ({ pod, component }) => {
  if (!component.cpuLimit) {
    return null;
  }
  const metrics = pod.metrics;

  const cpuLimit = sizeStringToNumber(component.cpuLimit!);
  const limit = cpuLimit * 1000; // metric data basic unit is 0.001 core

  return <SmallCPULineChart limit={limit} data={metrics && metrics.cpu} />;
};
