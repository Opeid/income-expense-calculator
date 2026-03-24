import { useState } from "react";
import {
  Divider,
  Flex,
  NumberInput,
  Text,
  hubspot,
} from "@hubspot/ui-extensions";

hubspot.extend(() => <MonthlyIncomeCard />);

const toNum = (v) => parseFloat(v) || 0;
const fmt = (v) => `$${toNum(v).toFixed(2)}`;

const Dot = () => (
  <Text format={{ color: "success" }}>●</Text>
);

const ReadonlyAmount = ({ value }) => (
  <Text format={{ fontWeight: "bold" }}>{fmt(value)}</Text>
);

const MonthlyIncomeCard = () => {
  const [primaryWages, setPrimaryWages] = useState(0);
  const [primarySS, setPrimarySS] = useState(0);
  const [primaryPension, setPrimaryPension] = useState(0);

  const [spouseWages, setSpouseWages] = useState(0);
  const [spouseSS, setSpouseSS] = useState(0);
  const [spousePension, setSpousePension] = useState(0);

  const [dividends, setDividends] = useState(0);
  const [rentalIncome, setRentalIncome] = useState(0);
  const [rentalExpenses, setRentalExpenses] = useState(0);
  const [distributions, setDistributions] = useState(0);
  const [alimony, setAlimony] = useState(0);
  const [childSupport, setChildSupport] = useState(0);
  const [otherSubsidy, setOtherSubsidy] = useState(0);
  const [otherIncome1, setOtherIncome1] = useState(0);
  const [otherIncome2, setOtherIncome2] = useState(0);

  const primaryTotal =
    toNum(primaryWages) + toNum(primarySS) + toNum(primaryPension);
  const spouseTotal =
    toNum(spouseWages) + toNum(spouseSS) + toNum(spousePension);
  const rentalNet = toNum(rentalIncome) - toNum(rentalExpenses);

  const totalMonthly =
    primaryTotal +
    spouseTotal +
    toNum(dividends) +
    rentalNet +
    toNum(distributions) +
    toNum(alimony) +
    toNum(childSupport) +
    toNum(otherSubsidy) +
    toNum(otherIncome1) +
    toNum(otherIncome2);

  const simpleRows = [
    {
      label: "Distributions (K-1)",
      value: distributions,
      onChange: setDistributions,
      name: "distributions",
    },
    {
      label: "Alimony",
      value: alimony,
      onChange: setAlimony,
      name: "alimony",
    },
    {
      label: "Child Support",
      value: childSupport,
      onChange: setChildSupport,
      name: "childSupport",
    },
    {
      label: "Other (Rent subsidy, Oil credit, etc.)",
      value: otherSubsidy,
      onChange: setOtherSubsidy,
      name: "otherSubsidy",
    },
    {
      label: "Other Income",
      value: otherIncome1,
      onChange: setOtherIncome1,
      name: "otherIncome1",
    },
    {
      label: "Other Income",
      value: otherIncome2,
      onChange: setOtherIncome2,
      name: "otherIncome2",
    },
  ];

  return (
    <Flex direction="column" gap="sm">
      {/* Title */}
      <Text format={{ fontWeight: "bold", fontSize: "xl" }}>
        Income Expenses Calculator
      </Text>
      <Divider />

      {/* Column headers */}
      <Flex justify="between">
        <Text format={{ fontWeight: "bold" }}>Source of Income</Text>
        <Text>Monthly</Text>
      </Flex>
      <Divider />

      {/* Primary Taxpayer */}
      <Text>Primary Taxpayer</Text>
      <Flex align="end" gap="xs" justify="between">
        <Flex align="end" gap="xs">
          <Dot />
          <NumberInput
            label="Wages"
            name="primaryWages"
            value={primaryWages}
            onChange={setPrimaryWages}
            prefix="$"
          />
          <Text>+</Text>
          <NumberInput
            label="Social Security"
            name="primarySS"
            value={primarySS}
            onChange={setPrimarySS}
            prefix="$"
          />
          <Text>+</Text>
          <NumberInput
            label="Pension(s)"
            name="primaryPension"
            value={primaryPension}
            onChange={setPrimaryPension}
            prefix="$"
          />
          <Text>=</Text>
        </Flex>
        <ReadonlyAmount value={primaryTotal} />
      </Flex>

      {/* Spouse / Other contributors */}
      <Text>Spouse/Other contributors to the household</Text>
      <Flex align="end" gap="xs" justify="between">
        <Flex align="end" gap="xs">
          <Dot />
          <NumberInput
            label="Wages"
            name="spouseWages"
            value={spouseWages}
            onChange={setSpouseWages}
            prefix="$"
          />
          <Text>+</Text>
          <NumberInput
            label="Social Security"
            name="spouseSS"
            value={spouseSS}
            onChange={setSpouseSS}
            prefix="$"
          />
          <Text>+</Text>
          <NumberInput
            label="Pension(s)"
            name="spousePension"
            value={spousePension}
            onChange={setSpousePension}
            prefix="$"
          />
          <Text>=</Text>
        </Flex>
        <ReadonlyAmount value={spouseTotal} />
      </Flex>

      {/* Dividends - Interest */}
      <Flex align="center" justify="between">
        <Flex align="center" gap="xs">
          <Dot />
          <Text>Dividends - Interest</Text>
        </Flex>
        <NumberInput
          label=""
          name="dividends"
          value={dividends}
          onChange={setDividends}
          prefix="$"
        />
      </Flex>

      {/* Rental Income - Expenses */}
      <Flex align="end" gap="xs" justify="between">
        <Flex align="end" gap="xs">
          <Dot />
          <NumberInput
            label="Rental Income"
            name="rentalIncome"
            value={rentalIncome}
            onChange={setRentalIncome}
            prefix="$"
          />
          <Text>-</Text>
          <NumberInput
            label="Rental Expenses"
            name="rentalExpenses"
            value={rentalExpenses}
            onChange={setRentalExpenses}
            prefix="$"
          />
          <Text>=</Text>
        </Flex>
        <ReadonlyAmount value={rentalNet} />
      </Flex>

      {/* Simple single-input rows */}
      {simpleRows.map(({ label, value, onChange, name }) => (
        <Flex key={name} align="center" justify="between">
          <Flex align="center" gap="xs">
            <Dot />
            <Text>{label}</Text>
          </Flex>
          <NumberInput
            label=""
            name={name}
            value={value}
            onChange={onChange}
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
