import { storiesOf } from "@storybook/react";
import { AutoCompleteMultipleValue, AutoCompleteMultiValuesFreeSolo } from "forms/Final/autoComplete";
import { FormDataPreview } from "forms/Final/util";
import { NormalizePorts, stringArrayTrimParse } from "forms/normalizer";
import { ValidatorArrayOfIsValidHostInCertificate } from "forms/validator";
import React from "react";
import { Field, FieldRenderProps, Form } from "react-final-form";

export const MultipleNumberValuesFreeSolo = () => (
  <Form
    onSubmit={console.log}
    keepDirtyOnReinitialize
    render={({ values }) => (
      <form>
        <Field
          render={(props: FieldRenderProps<number[]>) => (
            <AutoCompleteMultiValuesFreeSolo<number> {...props} options={[8080, 443, 3000]} />
          )}
          label="Value type is number"
          name="values"
          placeholder={"Select specific values"}
          parse={NormalizePorts}
        />

        <FormDataPreview />
      </form>
    )}
  />
);

export const MultipleStringValuesFreeSolo = () => (
  <Form
    onSubmit={console.log}
    keepDirtyOnReinitialize
    render={({ values }) => (
      <form>
        <Field
          render={(props: FieldRenderProps<string[]>) => (
            <AutoCompleteMultiValuesFreeSolo<string> {...props} options={["hello", "system", "database"]} />
          )}
          label="Value type is string"
          name="values"
          placeholder={"Select string values"}
          parse={stringArrayTrimParse}
        />

        <Field
          render={(props: FieldRenderProps<string[]>) => (
            <AutoCompleteMultiValuesFreeSolo<string> {...props} options={["kalm.dev", "*.google.com", "example.com"]} />
          )}
          label="Validate hosts"
          name="hosts"
          placeholder={"Select or type"}
          validate={ValidatorArrayOfIsValidHostInCertificate}
          parse={stringArrayTrimParse}
        />

        <FormDataPreview />
      </form>
    )}
  />
);

export const MultipleValueSelect = () => (
  <Form
    onSubmit={console.log}
    keepDirtyOnReinitialize
    render={({ values }) => (
      <form>
        <Field
          render={(props: FieldRenderProps<string[]>) => (
            <AutoCompleteMultipleValue {...props} options={["value1", "system", "database"]} />
          )}
          label="Value type is string"
          name="values"
          placeholder={"Select specific values"}
          parse={stringArrayTrimParse}
        />

        <FormDataPreview />
      </form>
    )}
  />
);

// export const SingleValueSelect = () => (
//   <Form
//     onSubmit={console.log}
//     keepDirtyOnReinitialize
//     render={({ values }) => (
//       <form>
//         <Field
//           render={(props: FieldRenderProps<string>) => (
//             <AutoCompleteSingleValue {...props} options={["value1", "system", "database"]} />
//           )}
//           label="Value type is string"
//           name="values"
//           placeholder={"Select specific values"}
//           parse={NormalizeString}
//         />

//         <Field
//           render={(props: FieldRenderProps<string>) => (
//             <AutoCompleteSingleValue
//               {...props}
//               options={["mysql", "mongo", "postgres", "nginx", "envoy"]}
//               optionsForRender={[
//                 {
//                   value: "mysql",
//                   label: "Mysql Database",
//                   group: "database",
//                 },
//                 {
//                   value: "mongo",
//                   label: "Mongo",
//                   group: "database",
//                 },
//                 {
//                   value: "postgres",
//                   label: "Postgres",
//                   group: "database",
//                 },
//                 {
//                   value: "nginx",
//                   label: "Nginx",
//                   group: "proxy",
//                 },
//                 {
//                   value: "envoy",
//                   label: "Envoy",
//                   group: "proxy",
//                 },
//               ]}
//             />
//           )}
//           label="Value type is string"
//           name="values2"
//           placeholder={"Select specific values"}
//           parse={NormalizeString}
//         />

//         <FormDataPreview />
//       </form>
//     )}
//   />
// );

storiesOf("Field/AutoComplete", module)
  .add("MultipleNumberValuesFreeSolo", () => {
    return <MultipleNumberValuesFreeSolo />;
  })
  .add("MultipleStringValuesFreeSolo", () => {
    return <MultipleStringValuesFreeSolo />;
  })
  .add("MultipleValueSelect", () => {
    return <MultipleValueSelect />;
  });
// .add("SingleValueSelect", () => {
//   return <SingleValueSelect />;
// });
