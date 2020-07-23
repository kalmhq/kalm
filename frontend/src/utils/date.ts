import { differenceInMinutes, format, parseISO } from "date-fns";

export type TimestampFilter = "1h" | "12h" | "24h" | "7days" | "all";

export const getStartTimestamp = (filter?: string): number => {
  let intervals = 60 * 60 * 24 * 365 * 1000;
  if (filter === "1h") {
    intervals = 60 * 60 * 1000;
  } else if (filter === "12h") {
    intervals = 60 * 60 * 12 * 1000;
  } else if (filter === "24h") {
    intervals = 60 * 60 * 24 * 1000;
  } else if (filter === "7days") {
    intervals = 60 * 60 * 24 * 7 * 1000;
  }

  return new Date().getTime() - intervals;
};

export const formatTimestamp = (timestamp: string): string => {
  return formatDate(parseISO(timestamp));
};

export const formatDate = (date: Date): string => {
  return format(date, "yyyy-MM-dd HH:mm:ss");
};

export const formatTimeDistance = (t: any) => {
  let minutes = differenceInMinutes(new Date(), t);
  if (minutes <= 1) {
    return "1m";
  }
  const day = Math.floor(minutes / 1440);
  const hour = Math.floor((minutes - day * 1440) / 60);
  minutes = minutes - day * 1440 - hour * 60;
  let res = "";

  if (day > 0) {
    res += `${day}d `;
  }

  if (hour > 0) {
    res += `${hour}h `;
  }

  if (minutes > 0) {
    res += `${minutes}m`;
  }
  return res;
};
