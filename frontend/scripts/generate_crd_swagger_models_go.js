const YAML = require("yaml");
const fs = require("fs");
const { exec } = require("child_process");

const baseDir = "controller/config/crd/bases/";
const fileNames = fs.readdirSync(baseDir).map(x => `${baseDir}${x}`);

const generateYamlTemplate = {
  swagger: "2.0",
  info: {
    version: "1.0.0",
    title: "Kapp Models",
    license: {
      name: "Apache 2.0",
      url: "http://www.apache.org/licenses/LICENSE-2.0.html"
    }
  },
  paths: {},
  definitions: {}
};

const fixGeneratedModelFile = fileName => {
  let content = fs.readFileSync(fileName).toString();

  content = content.replace("package openapi", "package kappmodel");

  fs.writeFileSync(fileName, content);
};

const ExtractModelFromFile = filepath => {
  const fileContent = fs.readFileSync(filepath);

  const value = YAML.parse(fileContent.toString());

  const keyName = value.spec.version + value.spec.names.kind;
  const keyContent = value.spec.validation.openAPIV3Schema;

  generateYamlTemplate.definitions[keyName] = keyContent;
  //   console.log(filepath, value);
};

const run = async () => {
  fileNames.forEach(ExtractModelFromFile);
  const tmpDir = `/tmp/kapp-web-${new Date().getTime()}`;
  fs.mkdirSync(tmpDir);

  const tmpSwaggerConfigFile = `${tmpDir}/swagger.yaml`;
  fs.writeFileSync(tmpSwaggerConfigFile, YAML.stringify(generateYamlTemplate));

  const command = `docker run --rm \
    -v ${tmpDir}:/local \
    openapitools/openapi-generator-cli generate \
    -i /local/swagger.yaml \
    -g go \
    -o /local/output`;

  console.log(command);

  const runCommandPromise = new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return reject(error);
      }

      if (stderr) {
        console.err(stderr);
      }

      if (stdout) {
        console.log(stdout);
      }

      resolve();
    });
  });

  await runCommandPromise;

  // remove current kapp models
  const currentModelsDir = __dirname + "/../../api/kappmodel";
  fs.readdirSync(currentModelsDir).map(x => fs.unlinkSync(`${currentModelsDir}/${x}`));

  // copy new models file into kappmodel dir
  const modelDir = `${tmpDir}/output`;
  fs.readdirSync(modelDir)
    .filter(x => x.startsWith("model_v1alpha1_"))
    .forEach(fileName => {
      const abFileName = `${modelDir}/${fileName}`;
      fixGeneratedModelFile(abFileName);
      fs.copyFileSync(abFileName, currentModelsDir + "/" + fileName);
    });

  console.log("tmpDir", tmpDir);
};

// cd kapp
// node frontend/scripts/generate_crd_swagger_models_go.js
run();
