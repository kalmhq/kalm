import { format, formatDistance, parseISO } from "date-fns";

export const formatISO = (timestamp: string): string => {
  return format(parseISO(timestamp), "yyyy-MM-dd HH:mm:ss");
};

export const formatISOWithNull = (timestamp?: string): string => {
  return !!timestamp ? formatISO(timestamp) : "";
};

export const formatAgoFromNow = (timestamp?: string) => {
  return !!timestamp ? formatDistance(parseISO(timestamp), new Date(), { addSuffix: true }) : "";
};
