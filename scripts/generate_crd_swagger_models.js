const YAML = require("yaml");
const fs = require("fs");
const { exec } = require("child_process");

const baseDir = "../kapp/config/crd/bases/";
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

  if (content.indexOf(`'metadata'?: object;`) !== -1) {
    content = content.replace(
      "'metadata'?: object;",
      "'metadata'?: V1ObjectMeta;"
    );

    content = content.replace(
      "import { RequestFile } from '../api';\n",
      "import { V1ObjectMeta } from '../model/models';\n"
    );
  }

  // rename enum
  //   const match = content.match(/export namespace (.*) {\n/);
  //   if (match) {
  //     const namespaceName = match[1];
  //     content = content.replace(
  //       `namespace ${namespaceName}`,
  //       `namespace ${namespaceName}Internal`
  //     );

  //     content.match(new RegExp(`${namespaceName}.(.*)Enum`, "g")).forEach(x => {
  //       content = content.replace(
  //         x,
  //         x.replace(namespaceName, namespaceName + "Internal")
  //       );
  //     });
  //   }

  const match = content.match(/export namespace (.*) {(.|[\r\n])*/m);
  if (match) {
    const enums = content.match(/export enum (.*) {(.|[\r\n])*?}/gm);
    content = content.replace(match[0], "");
    content = content.replace(
      new RegExp(match[1] + "\\.(.*)?Enum", "g"),
      "$1Enum"
    );

    enums.forEach(x => {
      content = content + "\n" + x.replace(/<any> /g, "");
    });
  }

  fs.writeFileSync(
    fileName,
    content.replace("import { RequestFile } from '../api';\n", "")
  );
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
    -g typescript-node \
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
  const currentModelsDir = __dirname + "/../src/kappModel";
  fs.readdirSync(currentModelsDir)
    .filter(x => x !== "List.ts")
    .map(x => fs.unlinkSync(`${currentModelsDir}/${x}`));

  const indexFileName = currentModelsDir + "/index.ts";
  fs.writeFileSync(indexFileName, "");

  // copy new models file into kappModel dir
  const modelDir = `${tmpDir}/output/model`;
  fs.readdirSync(modelDir)
    .filter(x => x !== "models.ts")
    .forEach(fileName => {
      const abFileName = `${modelDir}/${fileName}`;
      fixGeneratedModelFile(abFileName);
      fs.copyFileSync(abFileName, currentModelsDir + "/" + fileName);

      const exportStatement = `export { ${fileName.charAt(0).toUpperCase() +
        fileName.slice(1).replace(".ts", "")} } from "./${fileName.replace(
        ".ts",
        ""
      )}";\n`;
      fs.appendFileSync(indexFileName, exportStatement);
    });

  console.log("tmpDir", tmpDir);
};

run();
