import { regExpWildcardDomain } from "forms/validator";

const validHosts = ["baidu.com", "1.baidu.com", "*.baidu.com", "1.2.3.4.com", "*.1.2.2.3.4.com"];
const invalidHosts = ["baidu", "1233.33.55.44", "123.33.55.44", "*test.com"];
test("hosts regexp", () => {
  validHosts.forEach((host) => {
    const regResultHostname = regExpWildcardDomain.exec(host);
    expect(Array.isArray(regResultHostname)).toBeTruthy();
  });
  invalidHosts.forEach((host) => {
    const regResultHostname = regExpWildcardDomain.exec(host);
    expect(Array.isArray(regResultHostname)).toBeFalsy();
  });
});
