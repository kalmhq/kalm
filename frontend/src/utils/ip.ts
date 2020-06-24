export const isPrivateIP = (ip: string) => {
  const parts = ip.split(".");

  return (
    parts[0] === "10" ||
    (parts[0] === "172" && parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31) ||
    (parts[0] === "192" && parts[1] === "168")
  );
};
