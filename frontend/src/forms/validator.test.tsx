import { ValidatorApplicationName } from "forms/validator";

test("ValidatorApplicationName", () => {
  const testCases = [
    [undefined, "Required"],
    ["", "Required"],
    ["n".repeat(100), "Max length is 63"],
    ["&^#$", "Not a valid DNS1123 label. Regex is /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/"],
  ];

  testCases.forEach((testCase) => {
    expect(ValidatorApplicationName(testCase[0])).toEqual(testCase[1]);
  });

  const badCases = [
    "",
    "A",
    "ABC",
    "aBc",
    "A1",
    "A-1",
    "1-A",
    "-",
    "a-",
    "-a",
    "1-",
    "-1",
    "_",
    "a_",
    "_a",
    "a_b",
    "1_",
    "_1",
    "1_2",
    ".",
    "a.",
    ".a",
    "a.b",
    "1.",
    ".1",
    "1.2",
    " ",
    "a ",
    " a",
    "a b",
    "1 ",
    " 1",
    "1 2",
  ];

  badCases.forEach((testCase) => {
    expect(ValidatorApplicationName(testCase)).toEqual(expect.anything());
  });

  // good Cases
  const goodCases = ["a", "ab", "abc", "a1", "a-1", "a--1--2--b", "0", "01", "012", "1a", "1-a", "1--a--b--2"];
  goodCases.forEach((testCase) => {
    expect(ValidatorApplicationName(testCase)).toEqual(undefined);
  });
});
