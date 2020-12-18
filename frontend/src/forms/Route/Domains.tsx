import { Box, Button, Grid } from "@material-ui/core";
import InputAdornment from "@material-ui/core/InputAdornment/InputAdornment";
import { FinalSelectField } from "forms/Final/select";
import { FinalTextField } from "forms/Final/textfield";
import { trimAndToLowerParse } from "forms/normalizer";
import React from "react";
import { Field } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { useSelector } from "react-redux";
import { RootState } from "reducers";
import { Domain } from "types/domains";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ValidatorArrayOfIsDNS1123SubDomain, ValidatorRequired } from "../validator";

export const RouteDomains: React.FC = () => {
  const allDomains: Domain[] = useSelector((state: RootState) => state.domains.domains);
  const domains = allDomains.filter((x) => x.txtStatus === "ready" || x.isBuiltIn);
  const domainsMap: { [key: string]: Domain } = {};
  domains.forEach((x) => (domainsMap[x.domain] = x));

  // a.com -> a.com
  // *.foo.bar -> .foo.bar
  // *alice.foo.bar -> --alice.foo.bar
  const normalizeWildcardDomain = (domain: string) => {
    if (domain.startsWith("*")) {
      if (domain.length > 1 && domain[1] !== ".") {
        return "--" + domain.slice(1);
      } else {
        return domain.slice(1);
      }
    }

    return domain;
  };

  const renderField = (domain: string, index: number) => {
    const exactMatchedDomain = domainsMap[domain];
    if (domain === "" || (exactMatchedDomain && !exactMatchedDomain.domain.startsWith("*"))) {
      return (
        <Field
          name={`hosts[${index}]`}
          component={FinalSelectField}
          label="Select a domain"
          options={domains.map((x) => ({
            value: normalizeWildcardDomain(x.domain),
            text: x.domain,
          }))}
        />
      );
    }

    for (let x of domains) {
      if (!x.domain.startsWith("*")) {
        continue;
      }

      const domainStaticSuffix = normalizeWildcardDomain(x.domain);

      if (domain.endsWith(domainStaticSuffix)) {
        const userInput = domain.slice(0, domain.length - domainStaticSuffix.length);

        if (userInput.includes(".")) {
          continue;
        }

        const format = (value: string) => {
          return value.slice(0, domain.length - domainStaticSuffix.length);
        };

        const parse = (value: string) => {
          if (value.startsWith(".")) {
            value = value.slice(1);
          }

          if (value.endsWith(".")) {
            value = value.slice(0, value.length - 1);
          }

          value = trimAndToLowerParse(value);

          return value + domainStaticSuffix;
        };

        return (
          <Field
            name={`hosts[${index}]`}
            parse={parse}
            format={format}
            autoFocus
            component={FinalTextField}
            endAdornment={<InputAdornment position="end">{domainStaticSuffix}</InputAdornment>}
            label="Domain"
          />
        );
      }
    }

    return (
      <Field name={`hosts[${index}]`} component={FinalTextField} disabled label="Domain" validate={ValidatorRequired} />
    );
  };

  return (
    <FieldArray<string, any>
      validate={ValidatorArrayOfIsDNS1123SubDomain}
      name="hosts"
      render={({ fields }) => (
        <div>
          <Box display="flex" mb={1}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => {
                fields.push("");
              }}
            >
              Add a domain
            </Button>
          </Box>
          {fields.value &&
            fields.value.map((host, index) => (
              <Grid container spacing={1} key={index}>
                <Grid item xs={10}>
                  {renderField(host, index)}
                </Grid>
                <Grid item md={2}>
                  <IconButtonWithTooltip
                    tooltipPlacement="top"
                    tooltipTitle="Delete"
                    aria-label="delete"
                    onClick={() => fields.remove(index)}
                  >
                    <DeleteIcon />
                  </IconButtonWithTooltip>
                </Grid>
              </Grid>
            ))}
        </div>
      )}
    />
  );
};
