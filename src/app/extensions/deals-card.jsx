import { useState, useEffect, useRef } from "react";
import {
  Alert,
  Button,
  Divider,
  Flex,
  NumberInput,
  Select,
  Tab,
  Tabs,
  Text,
  hubspot,
} from "@hubspot/ui-extensions";

hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <FinancialCalculators
    context={context}
    runServerlessFunction={runServerlessFunction}
    actions={actions}
  />
));

// ── Helpers ───────────────────────────────────────────────────────────────────

const toNum = (v) => parseFloat(v) || 0;
const fmt = (v) => `$${toNum(v).toFixed(2)}`;
const fmtPct = (v) => `${toNum(v).toFixed(1)}%`;
const parseStored = (raw, defaults) => {
  try { return { ...defaults, ...JSON.parse(raw || "{}") }; }
  catch { return { ...defaults }; }
};

// ── Defaults ──────────────────────────────────────────────────────────────────

const INCOME_DEFAULTS = {
  primary_wages: 0, primary_social_security: 0, primary_pension: 0,
  spouse_wages: 0, spouse_social_security: 0, spouse_pension: 0,
  dividends_interest: 0, rental_income: 0, rental_expenses: 0,
  distributions_k1: 0, alimony: 0, child_support: 0,
  other_subsidy: 0, other_income_1: 0, other_income_2: 0,
};

const EXPENSE_DEFAULTS = {
  food: 0, housekeeping_supplies: 0, apparel_services: 0,
  personal_care: 0, miscellaneous: 0,
  mortgage_1: 0, mortgage_2: 0, rent: 0, homeowner_insurance: 0,
  property_tax: 0, gas: 0, electricity: 0, water: 0,
  cable_internet_phone: 0, other_housing: 0,
  vehicle_payment_1: 0, vehicle_payment_2: 0, car_insurance: 0,
  gas_oil: 0, parking_tolls: 0, public_transportation: 0,
  health_insurance: 0, out_of_pocket_medical: 0, prescription: 0,
  child_care: 0, life_insurance_expense: 0, other_expenses: 0,
};

const ASSET_DEFAULTS = {
  bank_accounts: 0, cash_on_hand: 0,
  investments: 0, investments_qs: "80", investments_loan: 0,
  life_insurance: 0, life_insurance_qs: "80", life_insurance_loan: 0,
  retirement: 0, retirement_qs: "80", retirement_loan: 0,
  real_estate: 0, real_estate_qs: "80", real_estate_loan: 0,
  vehicle1: 0, vehicle1_qs: "80", vehicle1_loan: 0,
  vehicle2: 0, vehicle2_qs: "80", vehicle2_loan: 0,
  vehicle3: 0, vehicle3_qs: "80", vehicle3_loan: 0,
  vehicle4: 0, vehicle4_qs: "80", vehicle4_loan: 0,
  personal_effects: 0, personal_effects_qs: "80", personal_effects_loan: 0,
  other_assets: 0, other_assets_qs: "80", other_assets_loan: 0,
};

const QS_OPTIONS = [
  { label: "100%", value: "100" },
  { label: "80%", value: "80" },
  { label: "70%", value: "70" },
  { label: "60%", value: "60" },
  { label: "50%", value: "50" },
];

// ── Total Calculators ─────────────────────────────────────────────────────────

const calcIncomeTotal = (v) => {
  const primary = toNum(v.primary_wages) + toNum(v.primary_social_security) + toNum(v.primary_pension);
  const spouse = toNum(v.spouse_wages) + toNum(v.spouse_social_security) + toNum(v.spouse_pension);
  const rental = toNum(v.rental_income) - toNum(v.rental_expenses);
  return primary + spouse + rental + toNum(v.dividends_interest) +
    toNum(v.distributions_k1) + toNum(v.alimony) + toNum(v.child_support) +
    toNum(v.other_subsidy) + toNum(v.other_income_1) + toNum(v.other_income_2);
};

const calcExpensesTotal = (v) =>
  toNum(v.food) + toNum(v.housekeeping_supplies) + toNum(v.apparel_services) +
  toNum(v.personal_care) + toNum(v.miscellaneous) +
  toNum(v.mortgage_1) + toNum(v.mortgage_2) + toNum(v.rent) + toNum(v.homeowner_insurance) +
  toNum(v.property_tax) + toNum(v.gas) + toNum(v.electricity) + toNum(v.water) +
  toNum(v.cable_internet_phone) + toNum(v.other_housing) +
  toNum(v.vehicle_payment_1) + toNum(v.vehicle_payment_2) + toNum(v.car_insurance) +
  toNum(v.gas_oil) + toNum(v.parking_tolls) + toNum(v.public_transportation) +
  toNum(v.health_insurance) + toNum(v.out_of_pocket_medical) + toNum(v.prescription) +
  toNum(v.child_care) + toNum(v.life_insurance_expense) + toNum(v.other_expenses);

const calcEquity = (value, qs, loan) => toNum(value) * (toNum(qs) / 100) - toNum(loan);

const calcAssetsTotal = (v) => {
  const simple = toNum(v.bank_accounts) + toNum(v.cash_on_hand);
  const qs = ["investments", "life_insurance", "retirement", "real_estate",
    "vehicle1", "vehicle2", "vehicle3", "vehicle4", "personal_effects", "other_assets"]
    .reduce((sum, key) => sum + calcEquity(v[key], v[`${key}_qs`], v[`${key}_loan`]), 0);
  return simple + qs;
};

// ── Main Component ────────────────────────────────────────────────────────────

const FinancialCalculators = ({ context, runServerlessFunction, actions }) => {
  const objectId = context.crm.objectId;
  const saveTimers = useRef({});

  const [incomeValues, setIncomeValues] = useState({ ...INCOME_DEFAULTS });
  const [expenseValues, setExpenseValues] = useState({ ...EXPENSE_DEFAULTS });
  const [assetValues, setAssetValues] = useState({ ...ASSET_DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    actions.fetchCrmObjectProperties([
      "source_of_income_calculator",
      "source_of_expenses_calculator",
      "source_of_assets_calculator",
    ]).then((fetched) => {
      if (fetched.source_of_income_calculator)
        setIncomeValues(parseStored(fetched.source_of_income_calculator, INCOME_DEFAULTS));
      if (fetched.source_of_expenses_calculator)
        setExpenseValues(parseStored(fetched.source_of_expenses_calculator, EXPENSE_DEFAULTS));
      if (fetched.source_of_assets_calculator)
        setAssetValues(parseStored(fetched.source_of_assets_calculator, ASSET_DEFAULTS));
    }).catch(() => {});
  }, []);

  const save = (propertyName, data) => {
    clearTimeout(saveTimers.current[propertyName]);
    setSaving(true);
    setSaveError(null);
    saveTimers.current[propertyName] = setTimeout(() => {
      const fallback = setTimeout(() => {
        setSaving(false);
        setLastSaved(new Date().toLocaleTimeString());
      }, 3000);
      runServerlessFunction({
        name: "saveIncomeProperty",
        parameters: { propertyName, data, objectId },
        callback: (result) => {
          clearTimeout(fallback);
          setSaving(false);
          const response = result?.response ?? result;
          if (response?.status === "error") setSaveError(response.message);
          else setLastSaved(new Date().toLocaleTimeString());
        },
      });
    }, 500);
  };

  const handleChange = (propertyName, currentValues, setter, key, val) => {
    const updated = { ...currentValues, [key]: val };
    setter(updated);
    save(propertyName, updated);
  };

  const handleReset = (propertyName, defaults, setter) => {
    const fresh = { ...defaults };
    setter(fresh);
    save(propertyName, fresh);
  };

  return (
    <Flex direction="column" gap="sm">
      {saving && <Text format={{ color: "medium" }}>Saving...</Text>}
      {!saving && lastSaved && <Text format={{ color: "medium" }}>Saved at {lastSaved}</Text>}
      {saveError && <Alert title="Save Error" variant="error">{saveError}</Alert>}

      <Tabs defaultSelected="income">
        <Tab tabId="income" title="Monthly Income">
          <IncomeTab
            values={incomeValues}
            onChange={(key, val) =>
              handleChange("source_of_income_calculator", incomeValues, setIncomeValues, key, val)
            }
            onReset={() => handleReset("source_of_income_calculator", INCOME_DEFAULTS, setIncomeValues)}
          />
        </Tab>
        <Tab tabId="expenses" title="Monthly Expenses">
          <ExpensesTab
            values={expenseValues}
            onChange={(key, val) =>
              handleChange("source_of_expenses_calculator", expenseValues, setExpenseValues, key, val)
            }
            onReset={() => handleReset("source_of_expenses_calculator", EXPENSE_DEFAULTS, setExpenseValues)}
          />
        </Tab>
        <Tab tabId="assets" title="Assets">
          <AssetsTab
            values={assetValues}
            onChange={(key, val) =>
              handleChange("source_of_assets_calculator", assetValues, setAssetValues, key, val)
            }
            onReset={() => handleReset("source_of_assets_calculator", ASSET_DEFAULTS, setAssetValues)}
          />
        </Tab>
        <Tab tabId="summary" title="Summary">
          <SummaryTab
            income={incomeValues}
            expenses={expenseValues}
            assets={assetValues}
          />
        </Tab>
      </Tabs>
    </Flex>
  );
};

// ── Shared UI ─────────────────────────────────────────────────────────────────

const Dot = () => <Text format={{ color: "success" }}>●</Text>;

const SectionTotal = ({ label, total }) => (
  <Flex justify="end" align="center" gap="md">
    <Text format={{ fontWeight: "bold" }}>{label}</Text>
    <Text format={{ fontWeight: "bold", color: "alert" }}>{fmt(total)}</Text>
  </Flex>
);

const StatRow = ({ label, value, color }) => (
  <Flex justify="between" align="center">
    <Text>{label}</Text>
    {color
      ? <Text format={{ fontWeight: "bold", color }}>{value}</Text>
      : <Text format={{ fontWeight: "bold" }}>{value}</Text>
    }
  </Flex>
);

const TabFooter = ({ onReset }) => (
  <Flex direction="column" gap="sm">
    <Divider />
    <Flex justify="end">
      <Button variant="secondary" onClick={onReset}>Clear All</Button>
    </Flex>
  </Flex>
);

// ── Income Tab ────────────────────────────────────────────────────────────────

const IncomeTab = ({ values: v, onChange, onReset }) => {
  const primaryTotal = toNum(v.primary_wages) + toNum(v.primary_social_security) + toNum(v.primary_pension);
  const spouseTotal = toNum(v.spouse_wages) + toNum(v.spouse_social_security) + toNum(v.spouse_pension);
  const rentalNet = toNum(v.rental_income) - toNum(v.rental_expenses);
  const totalMonthly = calcIncomeTotal(v);

  const simpleRows = [
    { label: "Distributions (K-1)", key: "distributions_k1" },
    { label: "Alimony", key: "alimony" },
    { label: "Child Support", key: "child_support" },
    { label: "Other (Rent subsidy, Oil credit, etc.)", key: "other_subsidy" },
    { label: "Other Income 1", key: "other_income_1" },
    { label: "Other Income 2", key: "other_income_2" },
  ];

  return (
    <Flex direction="column" gap="sm">
      <Flex justify="between">
        <Text format={{ fontWeight: "bold" }}>Source of Income</Text>
        <Text>Monthly</Text>
      </Flex>
      <Divider />

      <Text>Primary Taxpayer</Text>
      <Flex align="end" gap="xs" justify="between">
        <Flex align="end" gap="xs">
          <Dot />
          <NumberInput label="Wages" name="primary_wages" value={v.primary_wages} onChange={(val) => onChange("primary_wages", val)} prefix="$" />
          <Text>+</Text>
          <NumberInput label="Social Security" name="primary_social_security" value={v.primary_social_security} onChange={(val) => onChange("primary_social_security", val)} prefix="$" />
          <Text>+</Text>
          <NumberInput label="Pension(s)" name="primary_pension" value={v.primary_pension} onChange={(val) => onChange("primary_pension", val)} prefix="$" />
          <Text>=</Text>
        </Flex>
        <Text format={{ fontWeight: "bold" }}>{fmt(primaryTotal)}</Text>
      </Flex>

      <Text>Spouse/Other contributors to the household</Text>
      <Flex align="end" gap="xs" justify="between">
        <Flex align="end" gap="xs">
          <Dot />
          <NumberInput label="Wages" name="spouse_wages" value={v.spouse_wages} onChange={(val) => onChange("spouse_wages", val)} prefix="$" />
          <Text>+</Text>
          <NumberInput label="Social Security" name="spouse_social_security" value={v.spouse_social_security} onChange={(val) => onChange("spouse_social_security", val)} prefix="$" />
          <Text>+</Text>
          <NumberInput label="Pension(s)" name="spouse_pension" value={v.spouse_pension} onChange={(val) => onChange("spouse_pension", val)} prefix="$" />
          <Text>=</Text>
        </Flex>
        <Text format={{ fontWeight: "bold" }}>{fmt(spouseTotal)}</Text>
      </Flex>

      <Flex align="center" justify="between">
        <Flex align="center" gap="xs"><Dot /><Text>Dividends - Interest</Text></Flex>
        <NumberInput label="" name="dividends_interest" value={v.dividends_interest} onChange={(val) => onChange("dividends_interest", val)} prefix="$" />
      </Flex>

      <Flex align="end" gap="xs" justify="between">
        <Flex align="end" gap="xs">
          <Dot />
          <NumberInput label="Rental Income" name="rental_income" value={v.rental_income} onChange={(val) => onChange("rental_income", val)} prefix="$" />
          <Text>-</Text>
          <NumberInput label="Rental Expenses" name="rental_expenses" value={v.rental_expenses} onChange={(val) => onChange("rental_expenses", val)} prefix="$" />
          <Text>=</Text>
        </Flex>
        <Text format={{ fontWeight: "bold" }}>{fmt(rentalNet)}</Text>
      </Flex>

      {simpleRows.map(({ label, key }) => (
        <Flex key={key} align="center" justify="between">
          <Flex align="center" gap="xs"><Dot /><Text>{label}</Text></Flex>
          <NumberInput label="" name={key} value={v[key]} onChange={(val) => onChange(key, val)} prefix="$" />
        </Flex>
      ))}

      <Divider />
      <SectionTotal label="Total Monthly Income:" total={totalMonthly} />
      <TabFooter onReset={onReset} />
    </Flex>
  );
};

// ── Expenses Tab ──────────────────────────────────────────────────────────────

const ExpensesTab = ({ values: v, onChange, onReset }) => {
  const [open, setOpen] = useState({ food: true, housing: true, transport: true, health: true, other: true });
  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const Row = ({ label, fieldKey }) => (
    <Flex align="center" justify="between">
      <Flex align="center" gap="xs"><Dot /><Text>{label}</Text></Flex>
      <NumberInput label="" name={fieldKey} value={v[fieldKey]} onChange={(val) => onChange(fieldKey, val)} prefix="$" />
    </Flex>
  );

  const SectionHeader = ({ label, sectionKey, total }) => (
    <Flex justify="between" align="center">
      <Button variant="transparent" onClick={() => toggle(sectionKey)}>
        <Text format={{ fontWeight: "bold" }}>{open[sectionKey] ? "▼" : "▶"} {label}</Text>
      </Button>
      {!open[sectionKey] && <Text format={{ fontWeight: "bold", color: "alert" }}>{fmt(total)}</Text>}
    </Flex>
  );

  const foodTotal = toNum(v.food) + toNum(v.housekeeping_supplies) + toNum(v.apparel_services) + toNum(v.personal_care) + toNum(v.miscellaneous);
  const housingTotal = toNum(v.mortgage_1) + toNum(v.mortgage_2) + toNum(v.rent) + toNum(v.homeowner_insurance) + toNum(v.property_tax) + toNum(v.gas) + toNum(v.electricity) + toNum(v.water) + toNum(v.cable_internet_phone) + toNum(v.other_housing);
  const transportTotal = toNum(v.vehicle_payment_1) + toNum(v.vehicle_payment_2) + toNum(v.car_insurance) + toNum(v.gas_oil) + toNum(v.parking_tolls) + toNum(v.public_transportation);
  const healthTotal = toNum(v.health_insurance) + toNum(v.out_of_pocket_medical) + toNum(v.prescription);
  const otherTotal = toNum(v.child_care) + toNum(v.life_insurance_expense) + toNum(v.other_expenses);
  const grandTotal = foodTotal + housingTotal + transportTotal + healthTotal + otherTotal;

  return (
    <Flex direction="column" gap="sm">
      <SectionHeader label="Food, Clothing & Miscellaneous" sectionKey="food" total={foodTotal} />
      <Divider />
      {open.food && <>
        <Row label="Food" fieldKey="food" />
        <Row label="Housekeeping Supplies" fieldKey="housekeeping_supplies" />
        <Row label="Apparel & Services" fieldKey="apparel_services" />
        <Row label="Personal Care" fieldKey="personal_care" />
        <Row label="Miscellaneous" fieldKey="miscellaneous" />
        <SectionTotal label="Total Food, Clothing & Misc:" total={foodTotal} />
      </>}

      <SectionHeader label="Housing and Utilities" sectionKey="housing" total={housingTotal} />
      <Divider />
      {open.housing && <>
        <Row label="1st Lien Mortgage" fieldKey="mortgage_1" />
        <Row label="2nd Lien Mortgage" fieldKey="mortgage_2" />
        <Row label="Rent Payment" fieldKey="rent" />
        <Row label="Homeowner Insurance" fieldKey="homeowner_insurance" />
        <Row label="Property Tax" fieldKey="property_tax" />
        <Row label="Gas" fieldKey="gas" />
        <Row label="Electricity" fieldKey="electricity" />
        <Row label="Water" fieldKey="water" />
        <Row label="Cable / Internet / Phone" fieldKey="cable_internet_phone" />
        <Row label="Other Housing" fieldKey="other_housing" />
        <SectionTotal label="Total Housing & Utilities:" total={housingTotal} />
      </>}

      <SectionHeader label="Transportation" sectionKey="transport" total={transportTotal} />
      <Divider />
      {open.transport && <>
        <Row label="Vehicle Lease / Payment #1" fieldKey="vehicle_payment_1" />
        <Row label="Vehicle Lease / Payment #2" fieldKey="vehicle_payment_2" />
        <Row label="Car Insurance" fieldKey="car_insurance" />
        <Row label="Gas & Oil" fieldKey="gas_oil" />
        <Row label="Parking & Tolls" fieldKey="parking_tolls" />
        <Row label="Public Transportation" fieldKey="public_transportation" />
        <SectionTotal label="Total Transportation:" total={transportTotal} />
      </>}

      <SectionHeader label="Health Care" sectionKey="health" total={healthTotal} />
      <Divider />
      {open.health && <>
        <Row label="Health Insurance" fieldKey="health_insurance" />
        <Row label="Out-of-Pocket Medical" fieldKey="out_of_pocket_medical" />
        <Row label="Prescription Drugs" fieldKey="prescription" />
        <SectionTotal label="Total Health Care:" total={healthTotal} />
      </>}

      <SectionHeader label="Other Monthly Expenses" sectionKey="other" total={otherTotal} />
      <Divider />
      {open.other && <>
        <Row label="Child / Dependent Care" fieldKey="child_care" />
        <Row label="Life Insurance" fieldKey="life_insurance_expense" />
        <Row label="Other" fieldKey="other_expenses" />
        <SectionTotal label="Total Other Expenses:" total={otherTotal} />
      </>}

      <Divider />
      <SectionTotal label="Total Monthly Expenses:" total={grandTotal} />
      <TabFooter onReset={onReset} />
    </Flex>
  );
};

// ── Assets Tab ────────────────────────────────────────────────────────────────

const AssetsTab = ({ values: v, onChange, onReset }) => {
  const simpleAssets = [
    { label: "Bank Accounts", key: "bank_accounts" },
    { label: "Cash on Hand", key: "cash_on_hand" },
  ];

  const qsAssets = [
    { label: "Investments", key: "investments" },
    { label: "Life Insurance", key: "life_insurance" },
    { label: "Retirement Acc.", key: "retirement" },
    { label: "Real Estate", key: "real_estate" },
    { label: "Vehicle #1", key: "vehicle1" },
    { label: "Vehicle #2", key: "vehicle2" },
    { label: "Vehicle #3", key: "vehicle3" },
    { label: "Vehicle #4", key: "vehicle4" },
    { label: "Personal Effects", key: "personal_effects" },
    { label: "Other Assets", key: "other_assets" },
  ];

  const totalAssets = calcAssetsTotal(v);

  return (
    <Flex direction="column" gap="sm">
      <Text format={{ fontWeight: "bold" }}>Personal Assets</Text>
      <Divider />

      {simpleAssets.map(({ label, key }) => (
        <Flex key={key} align="center" justify="between">
          <Flex align="center" gap="xs"><Dot /><Text>{label}</Text></Flex>
          <Flex align="center" gap="sm">
            <NumberInput label="Market Value" name={key} value={v[key]} onChange={(val) => onChange(key, val)} prefix="$" />
            <Text format={{ fontWeight: "bold" }}>Equity: {fmt(toNum(v[key]))}</Text>
          </Flex>
        </Flex>
      ))}

      {qsAssets.map(({ label, key }) => (
        <Flex key={key} align="end" justify="between">
          <Flex align="center" gap="xs"><Dot /><Text>{label}</Text></Flex>
          <Flex align="end" gap="xs">
            <NumberInput label="Market Value" name={key} value={v[key]} onChange={(val) => onChange(key, val)} prefix="$" />
            <Select
              label="Quick Sale"
              name={`${key}_qs`}
              value={String(v[`${key}_qs`] ?? "80")}
              onChange={(val) => onChange(`${key}_qs`, val)}
              options={QS_OPTIONS}
            />
            <NumberInput label="Loan" name={`${key}_loan`} value={v[`${key}_loan`]} onChange={(val) => onChange(`${key}_loan`, val)} prefix="$" />
            <Text format={{ fontWeight: "bold" }}>
              Equity: {fmt(calcEquity(v[key], v[`${key}_qs`], v[`${key}_loan`]))}
            </Text>
          </Flex>
        </Flex>
      ))}

      <Divider />
      <SectionTotal label="Total Personal Asset Value:" total={totalAssets} />
      <TabFooter onReset={onReset} />
    </Flex>
  );
};

// ── Summary Tab ───────────────────────────────────────────────────────────────

const SummaryTab = ({ income, expenses, assets }) => {
  const totalIncome = calcIncomeTotal(income);
  const totalExpenses = calcExpensesTotal(expenses);
  const totalAssets = calcAssetsTotal(assets);
  const netCashFlow = totalIncome - totalExpenses;
  const netWorth = totalAssets - totalExpenses;
  const dti = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  const dtiColor = dti <= 36 ? "success" : dti <= 50 ? "warning" : "alert";
  const cashFlowColor = netCashFlow >= 0 ? "success" : "alert";
  const netWorthColor = netWorth >= 0 ? "success" : "alert";

  return (
    <Flex direction="column" gap="sm">
      <Text format={{ fontWeight: "bold" }}>Monthly Overview</Text>
      <Divider />
      <StatRow label="Total Monthly Income" value={fmt(totalIncome)} />
      <StatRow label="Total Monthly Expenses" value={fmt(totalExpenses)} />
      <StatRow label="Net Monthly Cash Flow" value={fmt(netCashFlow)} color={cashFlowColor} />
      <StatRow label="Debt-to-Income Ratio" value={fmtPct(dti)} color={dtiColor} />

      <Text format={{ fontWeight: "bold" }}>Assets</Text>
      <Divider />
      <StatRow label="Total Asset Value" value={fmt(totalAssets)} />
      <StatRow label="Net Worth (Assets − Monthly Expenses)" value={fmt(netWorth)} color={netWorthColor} />
    </Flex>
  );
};
