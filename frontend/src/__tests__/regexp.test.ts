import { regExpHostname } from "forms/validator";

const validHosts = ["baidu.com", "1.baidu.com", "*.baidu.com"];
const invalidHosts = ["baidu", "1233.33.55.44", "123.33.55.44"];
test("hosts regexp", () => {
  validHosts.forEach((host) => {
    const regResultHostname = regExpHostname.exec(host);
    expect(Array.isArray(regResultHostname)).toBeTruthy();
  });
  invalidHosts.forEach((host) => {
    const regResultHostname = regExpHostname.exec(host);
    expect(Array.isArray(regResultHostname)).toBeFalsy();
  });
});
