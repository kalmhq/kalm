import { regExpHostname } from "forms/validator";

const validHosts = ["baidu.com", "1.baidu.com", "*.baidu.com", "123.33.55.44"];
test("ip regexp", () => {
  validHosts.forEach((host) => {
    const regResultHostname = regExpHostname.exec(host);
    expect(Array.isArray(regResultHostname)).toBeTruthy();
  });
});
