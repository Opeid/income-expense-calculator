import { useState, useEffect } from "react";
import {
  Alert,
  Divider,
  Flex,
  LoadingSpinner,
  NumberInput,
  Text,
  hubspot,
} from "@hubspot/ui-extensions";

hubspot.extend(({ context, runServerlessFunction }) => (
  <MonthlyIncomeCard
    context={context}
    runServerlessFunction={runServerlessFunction}
  />
));

const toNum = (v) => parseFloat(v) || 0;
const fmt = (v) => `$${toNum(v).toFixed(2)}`;

const DEFAULTS = {
  primary_wages: 0,
  primary_social_security: 0,
  primary_pension: 0,
  spouse_wages: 0,
  spouse_social_security: 0,
  spouse_pension: 0,
  dividends_interest: 0,
  rental_income: 0,
  rental_expenses: 0,
  distributions_k1: 0,
  alimony: 0,
  child_support: 0,
  other_subsidy: 0,
  other_income_1: 0,
  other_income_2: 0,
};

const parseStored = (raw) => {
  try {
    return { ...DEFAULTS, ...JSON.parse(raw || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
};

const MonthlyIncomeCard = ({ context, runServerlessFunction }) => {
  const objectId = context.crm.objectId;

  const [values, setValues] = useState({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    runServerlessFunction({
      name: "loadIncomeData",
      parameters: { objectId },
      callback: ({ response }) => {
        if (response?.data) {
          setValues(parseStored(response.data));
        }
        setLoading(false);
      },
    });
  }, []);

  const handleChange = (key, val) => {
    const updated = { ...values, [key]: val };
    setValues(updated);
    setSaving(true);
    setSaveError(null);

    runServerlessFunction({
      name: "saveIncomeProperty",
      parameters: { data: updated, objectId },
      callback: ({ response, error }) => {
        setSaving(false);
        if (error || response?.status === "error") {
          setSaveError("Failed to save. Please try again.");
        }
      },
    });
  };

  const v = values;
  const primaryTotal = toNum(v.primary_wages) + toNum(v.primary_social_security) + toNum(v.primary_pension);
  const spouseTotal = toNum(v.spouse_wages) + toNum(v.spouse_social_security) + toNum(v.spouse_pension);
  const rentalNet = toNum(v.rental_income) - toNum(v.rental_expenses);
  const totalMonthly =
    primaryTotal + spouseTotal + toNum(v.dividends_interest) + rentalNet +
    toNum(v.distributions_k1) + toNum(v.alimony) + toNum(v.child_support) +
    toNum(v.other_subsidy) + toNum(v.other_income_1) + toNum(v.other_income_2);

  const simpleRows = [
    { label: "Distributions (K-1)", key: "distributions_k1" },
    { label: "Alimony", key: "alimony" },
    { label: "Child Support", key: "child_support" },
    { label: "Other (Rent subsidy, Oil credit, etc.)", key: "other_subsidy" },
    { label: "Other Income", key: "other_income_1" },
    { label: "Other Income", key: "other_income_2" },
  ];

  if (loading) {
    return (
      <Flex justify="center" align="center">
        <LoadingSpinner label="Loading..." showLabel={true} />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="sm">
      {/* Header */}
      <Flex justify="between" align="center">
        <Text format={{ fontWeight: "bold", fontSize: "xl" }}>
          Income Expenses Calculator
        </Text>
        {saving && <Text format={{ color: "medium" }}>Saving...</Text>}
      </Flex>

      {saveError && (
        <Alert title="Save Error" variant="error">
          {saveError}
        </Alert>
      )}

      <Divider />

      <Flex justify="between">
        <Text format={{ fontWeight: "bold" }}>Source of Income</Text>
        <Text>Monthly</Text>
      </Flex>
      <Divider />

      {/* Primary Taxpayer */}
      <Text>Primary Taxpayer</Text>
      <Flex align="end" gap="xs" justify="between">
        <Flex align="end" gap="xs">
          <Text format={{ color: "success" }}>●</Text>
          <NumberInput
            label="Wages"
            name="primary_wages"
            value={v.primary_wages}
            onChange={(val) => handleChange("primary_wages", val)}
            prefix="$"
          />
          <Text>+</Text>
          <NumberInput
            label="Social Security"
            name="primary_social_security"
            value={v.primary_social_security}
            onChange={(val) => handleChange("primary_social_security", val)}
            prefix="$"
          />
          <Text>+</Text>
          <NumberInput
            label="Pension(s)"
            name="primary_pension"
            value={v.primary_pension}
            onChange={(val) => handleChange("primary_pension", val)}
            prefix="$"
          />
          <Text>=</Text>
        </Flex>
        <Text format={{ fontWeight: "bold" }}>{fmt(primaryTotal)}</Text>
      </Flex>

      {/* Spouse / Other contributors */}
      <Text>Spouse/Other contributors to the household</Text>
      <Flex align="end" gap="xs" justify="between">
        <Flex align="end" gap="xs">
          <Text format={{ color: "success" }}>●</Text>
          <NumberInput
            label="Wages"
            name="spouse_wages"
            value={v.spouse_wages}
            onChange={(val) => handleChange("spouse_wages", val)}
            prefix="$"
          />
          <Text>+</Text>
          <NumberInput
            label="Social Security"
            name="spouse_social_security"
            value={v.spouse_social_security}
            onChange={(val) => handleChange("spouse_social_security", val)}
            prefix="$"
          />
          <Text>+</Text>
          <NumberInput
            label="Pension(s)"
            name="spouse_pension"
            value={v.spouse_pension}
            onChange={(val) => handleChange("spouse_pension", val)}
            prefix="$"
          />
          <Text>=</Text>
        </Flex>
        <Text format={{ fontWeight: "bold" }}>{fmt(spouseTotal)}</Text>
      </Flex>

      {/* Dividends - Interest */}
      <Flex align="center" justify="between">
        <Flex align="center" gap="xs">
          <Text format={{ color: "success" }}>●</Text>
          <Text>Dividends - Interest</Text>
        </Flex>
        <NumberInput
          label=""
          name="dividends_interest"
          value={v.dividends_interest}
          onChange={(val) => handleChange("dividends_interest", val)}
          prefix="$"
        />
      </Flex>

      {/* Rental */}
      <Flex align="end" gap="xs" justify="between">
        <Flex align="end" gap="xs">
          <Text format={{ color: "success" }}>●</Text>
          <NumberInput
            label="Rental Income"
            name="rental_income"
            value={v.rental_income}
            onChange={(val) => handleChange("rental_income", val)}
            prefix="$"
          />
          <Text>-</Text>
          <NumberInput
            label="Rental Expenses"
            name="rental_expenses"
            value={v.rental_expenses}
            onChange={(val) => handleChange("rental_expenses", val)}
            prefix="$"
          />
          <Text>=</Text>
        </Flex>
        <Text format={{ fontWeight: "bold" }}>{fmt(rentalNet)}</Text>
      </Flex>

      {/* Simple rows */}
      {simpleRows.map(({ label, key }) => (
        <Flex key={key} align="center" justify="between">
          <Flex align="center" gap="xs">
            <Text format={{ color: "success" }}>●</Text>
            <Text>{label}</Text>
          </Flex>
          <NumberInput
            label=""
            name={key}
            value={v[key]}
            onChange={(val) => handleChange(key, val)}
            prefix="$"
          />
        </Flex>
      ))}

      <Divider />

      {/* Total */}
      <Flex justify="end" align="center" gap="md">
        <Text format={{ fontWeight: "bold" }}>Total Monthly Income:</Text>
        <Text format={{ fontWeight: "bold", color: "alert" }}>
          {fmt(totalMonthly)}
        </Text>
      </Flex>
    </Flex>
  );
};
