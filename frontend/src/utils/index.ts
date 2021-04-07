export const ID = (): string => {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return Math.random().toString(36).substr(2, 9);
};

interface ResError {
  key: string;
  message: string;
}

const resErrorsToSubmitErrors = (errors: ResError[]) => {
  // "errors": [
  //   {
  //      "key": ".components[1].dependencies",
  //      "message": "should no have loop in dependencies"
  //   }
  // ]
  const submitErrors: { [key: string]: any } = {};
  errors.forEach((error) => {
    // ".components[1].dependencies".split(".")
    // => ["", "components[1]", "dependencies"]
    const keySplits = error.key.split(".");
    if (keySplits[1]) {
      if (keySplits[1] === "name") {
        submitErrors["name"] = error.message;
      } else if (keySplits[1].startsWith("components") && keySplits[2]) {
        if (submitErrors[keySplits[1]]) {
          submitErrors[keySplits[1]][keySplits[2]] = error.message;
        } else {
          submitErrors[keySplits[1]] = { [keySplits[2]]: error.message };
        }

        // if (submitErrors[keySplits[1]]) {
        //   let componentErrors: { [key: string]: string } = {};
        //   componentErrors = JSON.parse(submitErrors[keySplits[1]]);
        //   componentErrors[keySplits[2]] = error.message;
        //   submitErrors[keySplits[1]] = JSON.stringify(componentErrors[keySplits[2]]);
        // } else {
        //   submitErrors[keySplits[1]] = JSON.stringify({ [keySplits[2]]: error.message });
        // }
      }
    }
  });

  return submitErrors;
};

export const arraysMatch = (arr1: any[], arr2: any[]) => {
  // Check if the arrays are the same length
  if (arr1.length !== arr2.length) return false;

  // Check if all items exist and are in the same order
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  // Otherwise, return true
  return true;
};
