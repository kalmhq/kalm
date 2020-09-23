import React from "react";
import { Field, FieldRenderProps, Form } from "react-final-form";
import {
  AutoCompleteMultipleValue,
  AutoCompleteMultiValuesFreeSolo,
  AutoCompleteSingleValue,
} from "forms/Final/autoComplete";
import { NormalizePorts, NormalizeString, NormalizeStringArray } from "forms/normalizer";
import { storiesOf } from "@storybook/react";
import { ValidatorHosts } from "forms/validator";

export const MultipleNumberValuesFreeSolo = () => (
  <Form
    onSubmit={console.log}
    keepDirtyOnReinitialize={true}
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

        <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
      </form>
    )}
  />
);

export const MultipleStringValuesFreeSolo = () => (
  <Form
    onSubmit={console.log}
    keepDirtyOnReinitialize={true}
    render={({ values }) => (
      <form>
        <Field
          render={(props: FieldRenderProps<string[]>) => (
            <AutoCompleteMultiValuesFreeSolo<string> {...props} options={["hello", "system", "database"]} />
          )}
          label="Value type is string"
          name="values"
          placeholder={"Select string values"}
          parse={NormalizeStringArray}
        />

        <Field
          render={(props: FieldRenderProps<string[]>) => (
            <AutoCompleteMultiValuesFreeSolo<string> {...props} options={["kalm.dev", "*.google.com", "example.com"]} />
          )}
          label="Validate hosts"
          name="hosts"
          placeholder={"Select or type"}
          validate={ValidatorHosts}
          parse={NormalizeStringArray}
        />

        <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
      </form>
    )}
  />
);

export const MultipleValueSelect = () => (
  <Form
    onSubmit={console.log}
    keepDirtyOnReinitialize={true}
    render={({ values }) => (
      <form>
        <Field
          render={(props: FieldRenderProps<string[]>) => (
            <AutoCompleteMultipleValue {...props} options={["value1", "system", "database"]} />
          )}
          label="Value type is string"
          name="values"
          placeholder={"Select specific values"}
          parse={NormalizeStringArray}
        />

        <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
      </form>
    )}
  />
);

export const SingleValueSelect = () => (
  <Form
    onSubmit={console.log}
    keepDirtyOnReinitialize={true}
    render={({ values }) => (
      <form>
        <Field
          render={(props: FieldRenderProps<string>) => (
            <AutoCompleteSingleValue {...props} options={["value1", "system", "database"]} />
          )}
          label="Value type is string"
          name="values"
          placeholder={"Select specific values"}
          parse={NormalizeString}
        />

        <Field
          render={(props: FieldRenderProps<string>) => (
            <AutoCompleteSingleValue
              {...props}
              options={["mysql", "mongo", "postgres", "nginx", "envoy"]}
              optionsForRender={[
                {
                  value: "mysql",
                  label: "Mysql Database",
                  group: "database",
                },
                {
                  value: "mongo",
                  label: "Mongo",
                  group: "database",
                },
                {
                  value: "postgres",
                  label: "Postgres",
                  group: "database",
                },
                {
                  value: "nginx",
                  label: "Nginx",
                  group: "proxy",
                },
                {
                  value: "envoy",
                  label: "Envoy",
                  group: "proxy",
                },
              ]}
            />
          )}
          label="Value type is string"
          name="values2"
          placeholder={"Select specific values"}
          parse={NormalizeString}
        />

        <pre style={{ maxWidth: 1500, background: "#eee" }}>{JSON.stringify(values, undefined, 2)}</pre>
      </form>
    )}
  />
);

storiesOf("Field/AutoComplete", module)
  .add("MultipleNumberValuesFreeSolo", () => {
    return <MultipleNumberValuesFreeSolo />;
  })
  .add("MultipleStringValuesFreeSolo", () => {
    return <MultipleStringValuesFreeSolo />;
  })
  .add("MultipleValueSelect", () => {
    return <MultipleValueSelect />;
  })
  .add("SingleValueSelect", () => {
    return <SingleValueSelect />;
  });
