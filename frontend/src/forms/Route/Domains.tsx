import { Box, Grid } from "@material-ui/core";
import InputAdornment from "@material-ui/core/InputAdornment/InputAdornment";
import { FinalSelectField } from "forms/Final/select";
import { FinalTextField } from "forms/Final/textfield";
import { normalizeWildcardDomain, trimAndToLowerParse } from "forms/normalizer";
import React from "react";
import { Field } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { useSelector } from "react-redux";
import { RootState } from "reducers";
import { Domain } from "types/domains";
import { AddButton } from "widgets/Button";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { ValidatorArrayOfIsDNS1123SubDomainWithOptionalWildcardPrefix, ValidatorRequired } from "../validator";

export const RouteDomains: React.FC = () => {
  const domains: Domain[] = useSelector((state: RootState) => state.domains.domains);
  const domainsMap: { [key: string]: Domain } = {};
  domains.forEach((x) => (domainsMap[x.domain] = x));

  const renderField = (domain: string, index: number) => {
    const exactMatchedDomain = domainsMap[domain];
    if (domain === "" || (exactMatchedDomain && !exactMatchedDomain.domain.startsWith("*"))) {
      return (
        <Field
          name={`hosts[${index}]`}
          component={FinalSelectField}
          label="Select a domain"
          options={domains.map((x) => ({
            value: x.domain,
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

      if (!domain.endsWith(domainStaticSuffix)) {
        continue;
      }

      const userInput = domain.slice(0, domain.length - domainStaticSuffix.length);

      // invalid
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

        value = value.replaceAll(".", "-");
        value = trimAndToLowerParse(value);

        return value + domainStaticSuffix;
      };

      let domainStaticSuffixDisplayValue = domainStaticSuffix;
      if (domainStaticSuffixDisplayValue.endsWith("kalm-apps.com") && domainStaticSuffixDisplayValue.length > 40) {
        domainStaticSuffixDisplayValue = domainStaticSuffixDisplayValue.slice(0, 40) + "...";
      }

      return (
        <Field
          name={`hosts[${index}]`}
          parse={parse}
          format={format}
          autoFocus
          component={FinalTextField}
          endAdornment={<InputAdornment position="end">{domainStaticSuffixDisplayValue}</InputAdornment>}
          label="Domain"
        />
      );
    }

    return (
      <Field name={`hosts[${index}]`} component={FinalTextField} disabled label="Domain" validate={ValidatorRequired} />
    );
  };

  return (
    <FieldArray<string, any>
      validate={ValidatorArrayOfIsDNS1123SubDomainWithOptionalWildcardPrefix}
      name="hosts"
      render={({ fields }) => (
        <div>
          <Box display="flex" mb={1}>
            <AddButton
              onClick={() => {
                fields.push("");
              }}
            >
              Add a Domain
            </AddButton>
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
