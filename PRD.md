# Product Requirements Document — Income Expenses Calculator

**Version:** 1.0
**Platform:** HubSpot UI Extension (Developer Project)
**Location:** Deal record → Calculator tab
**Last Updated:** March 2026

---

## 1. Overview

### 1.1 Problem Statement

Financial advisors and case managers working deals in HubSpot need to capture a complete financial picture of their clients — monthly income, monthly expenses, and personal assets — directly within the deal record. Without this, teams must maintain separate spreadsheets outside of HubSpot, creating data silos and version control problems.

### 1.2 Solution

The **Income Expenses Calculator** is a HubSpot CRM card that lives as a dedicated tab on every Deal record. It provides a structured, three-section financial calculator with a summary dashboard. All values auto-save on entry and persist across sessions, keeping financial data inside HubSpot alongside the rest of the deal.

### 1.3 Goals

- Capture a client's full financial profile without leaving HubSpot
- Auto-save all data so nothing is lost on navigation or page refresh
- Surface key financial metrics (net cash flow, DTI ratio, net worth) automatically
- Require zero training — the UI mirrors familiar financial intake forms

---

## 2. Users

| Role | How They Use It |
|---|---|
| Financial Advisor | Enters client income, expenses, and assets during intake meetings |
| Case Manager | Reviews and updates values as client situation changes |
| Manager / Reviewer | Reads the Summary tab to assess deal health at a glance |

---

## 3. Features

### 3.1 Monthly Income Tab

Calculates total monthly income across all sources.

**Primary Taxpayer**
- Wages
- Social Security
- Pension(s)
- Row total auto-calculated

**Spouse / Other Contributors**
- Wages
- Social Security
- Pension(s)
- Row total auto-calculated

**Additional Sources**
- Dividends / Interest
- Rental Income minus Rental Expenses (net shown)
- Distributions (K-1)
- Alimony
- Child Support
- Other (Rent subsidy, Oil credit, etc.)
- Other Income 1
- Other Income 2

**Footer**
- Total Monthly Income (sum of all sources)
- Notes field (free-text)
- Clear All button

---

### 3.2 Monthly Expenses Tab

Captures monthly expenses across five categories with section totals and a grand total.

**Food, Clothing & Miscellaneous**
- Food
- Housekeeping Supplies
- Apparel & Services
- Personal Care
- Miscellaneous

**Housing and Utilities**
- 1st Lien Mortgage
- 2nd Lien Mortgage
- Rent Payment
- Homeowner Insurance
- Property Tax
- Gas
- Electricity
- Water
- Cable / Internet / Phone
- Other Housing

**Transportation**
- Vehicle Lease / Payment #1
- Vehicle Lease / Payment #2
- Car Insurance
- Gas & Oil
- Parking & Tolls
- Public Transportation

**Health Care**
- Health Insurance
- Out-of-Pocket Medical
- Prescription Drugs

**Other Monthly Expenses**
- Child / Dependent Care
- Life Insurance
- Other

**Footer**
- Section totals displayed after each category
- Total Monthly Expenses (grand total)
- Notes field (free-text)
- Clear All button

---

### 3.3 Assets Tab

Captures personal asset values with quick-sale percentage and loan balance to calculate net equity per asset.

**Simple Assets** (Market Value = Equity)
- Bank Accounts
- Cash on Hand

**Assets with Quick Sale % and Loan Balance**

For each of the following, user enters: Market Value + Quick Sale % (100 / 80 / 70 / 60 / 50) + Loan Balance. Equity is calculated automatically.

> **Equity Formula:** `Market Value × Quick Sale% − Loan Balance`

Assets:
- Investments
- Life Insurance
- Retirement Account
- Real Estate
- Vehicle #1, #2, #3, #4
- Personal Effects
- Other Assets

**Footer**
- Total Personal Asset Value
- Notes field (free-text)
- Clear All button

---

### 3.4 Summary Tab

Provides a real-time financial snapshot computed from the other three tabs. No data entry — read only.

| Metric | Formula |
|---|---|
| Total Monthly Income | Sum of all income sources |
| Total Monthly Expenses | Sum of all expense categories |
| Net Monthly Cash Flow | Income − Expenses |
| Debt-to-Income Ratio | Expenses ÷ Income × 100 |
| Total Asset Value | Sum of all asset equity values |
| Net Worth | Total Assets − Monthly Expenses |

**Alert:** If monthly expenses exceed monthly income, a red warning banner is shown: *"Monthly expenses exceed income by $X.XX"*

---

### 3.5 Auto-Save

- Every field change triggers a debounced save (500ms after the last keystroke)
- Each tab saves independently — changing income fields does not cancel a pending expense save
- "Saving..." indicator shown during active save
- "Saved at HH:MM:SS" confirmation displayed after save completes
- 3-second fallback timeout clears the saving indicator if the callback does not fire

---

### 3.6 Notes

Each tab includes a free-text Notes field. Notes are saved as part of the same JSON blob as the numeric values, so no additional HubSpot properties are needed.

---

### 3.7 Clear All

Each tab has a **Clear All** button that resets all fields (including notes) on that tab to zero/empty and immediately saves the cleared state to HubSpot.

---

## 4. Data Model

All data is stored as JSON strings in three custom HubSpot Deal properties of type **Multi-line text (textarea)**:

| Tab | HubSpot Property Name |
|---|---|
| Monthly Income | `source_of_income_calculator` |
| Monthly Expenses | `source_of_expenses_calculator` |
| Assets | `source_of_assets_calculator` |

Each property holds a single JSON object. Example for income:

```json
{
  "primary_wages": 5000,
  "primary_social_security": 0,
  "primary_pension": 0,
  "spouse_wages": 2500,
  "spouse_social_security": 0,
  "spouse_pension": 0,
  "dividends_interest": 200,
  "rental_income": 1500,
  "rental_expenses": 400,
  "distributions_k1": 0,
  "alimony": 0,
  "child_support": 0,
  "other_subsidy": 0,
  "other_income_1": 0,
  "other_income_2": 0,
  "notes": "Client expects a raise in Q3"
}
```

**Why JSON blobs?** Storing all values in a single property per tab avoids creating dozens of individual HubSpot properties, keeps the data model simple, and makes it easy to add new fields without schema changes.

---

## 5. Technical Architecture

### 5.1 Stack

| Layer | Technology |
|---|---|
| UI Framework | HubSpot UI Extensions (`@hubspot/ui-extensions` v0.12.3) |
| Frontend | React 18 |
| Backend | HubSpot Serverless Functions (Node.js) |
| HTTP Client | axios |
| Platform Version | HubSpot Developer Projects 2025.1 |
| Deployment | GitHub → HubSpot CI/CD (push to `main` auto-deploys) |

### 5.2 Project Structure

```
hubspot-deals-extension/
├── hsproject.json                     # Project name + platform version
├── src/
│   └── app/
│       ├── app.json                   # App name, scopes (read + write deals)
│       ├── app.functions/
│       │   ├── serverless.json        # Registers serverless functions with HubSpot
│       │   ├── package.json           # axios dependency
│       │   ├── loadIncomeData.js      # Reads all three properties in one API call
│       │   └── saveIncomeProperty.js  # Writes JSON to a specified deal property
│       └── extensions/
│           ├── package.json           # @hubspot/ui-extensions + react
│           ├── deals-card.json        # Card config (title, location, propertiesToSend)
│           └── deals-card.jsx         # Full React UI — all four tabs
```

### 5.3 Data Flow

**On Card Load**
1. HubSpot renders the card and pre-loads the three properties via `propertiesToSend` in `deals-card.json`
2. `useEffect` calls `actions.fetchCrmObjectProperties(["source_of_income_calculator", ...])` directly from the HubSpot SDK
3. Each property value (a JSON string) is parsed and merged with default values using `parseStored(raw, defaults)`
4. React state is initialized with the parsed values — all fields populate immediately

> **Why `actions.fetchCrmObjectProperties` instead of a serverless function?**
> HubSpot's `runServerlessFunction` callback does not fire reliably when called from a React `useEffect` on mount. `actions.fetchCrmObjectProperties` is a direct SDK call that resolves as a Promise and works correctly in `useEffect`.

**On Field Change**
1. User changes a value in any input
2. React state updates immediately (UI feels instant)
3. A 500ms debounce timer starts for that tab's property
4. After 500ms of no further changes, `runServerlessFunction` calls `saveIncomeProperty` with the full values object
5. `saveIncomeProperty` serializes the object to JSON and PATCHes the HubSpot CRM API

**Authentication**
- Serverless functions authenticate to the HubSpot CRM API using a Private App access token
- The token is stored as a HubSpot project secret (`PRIVATE_APP_ACCESS_TOKEN`) and accessed via `process.env.PRIVATE_APP_ACCESS_TOKEN`
- It is never exposed to the frontend

### 5.4 Key Implementation Decisions

| Decision | Reason |
|---|---|
| Use `axios`, not `@hubspot/api-client` | `@hubspot/api-client` causes build failures in HubSpot serverless functions |
| Use `return`, not `sendResponse` | HubSpot 2025.1 serverless functions must return the result directly |
| No `functions` key in `app.json` | Functions are auto-discovered via `app.functions/serverless.json` |
| No `serverlessFunctions` key in card JSON | Not needed when using `serverless.json` registration |
| Separate debounce timer per property | Prevents a change on one tab from cancelling a pending save on another tab |
| 3-second fallback to clear "Saving..." | `runServerlessFunction` callbacks do not always fire; data still saves correctly |

---

## 6. Serverless Functions

### `loadIncomeData.js`
- **Trigger:** Called on mount via `useEffect` + `actions.fetchCrmObjectProperties` (not this function directly — kept for potential future use)
- **Input:** `{ objectId }`
- **Output:** `{ income, expenses, assets }` — raw JSON strings from HubSpot properties
- **API:** `GET /crm/v3/objects/deals/{objectId}?properties=...`

### `saveIncomeProperty.js`
- **Trigger:** Called on every debounced field change
- **Input:** `{ propertyName, data, objectId }`
- **Output:** `{ status: "success" }` or `{ status: "error", message: "..." }`
- **API:** `PATCH /crm/v3/objects/deals/{objectId}`

---

## 7. HubSpot Setup Requirements

Before deploying, the following must exist in the HubSpot portal:

**Three custom Deal properties** (type: Multi-line text):

| Label | Internal Name |
|---|---|
| Income Calculator | `source_of_income_calculator` |
| Expenses Calculator | `source_of_expenses_calculator` |
| Assets Calculator | `source_of_assets_calculator` |

**One Private App** with scopes:
- `crm.objects.deals.read`
- `crm.objects.deals.write`

**One Project Secret:**
```
PRIVATE_APP_ACCESS_TOKEN = <private app access token>
```

---

## 8. Deployment

The project is linked to the `income-expense-calculator` GitHub repository. Any push to `main` automatically triggers a build and deploy in HubSpot.

**Check build status:**
`app.hubspot.com/developer-projects/244621034/project/hubspot-deals-extension/activity`

**Manual deploy:**
```bash
hs project upload --account=244621034
```

---

## 9. Non-Goals

- This is not a general-purpose form builder — fields are fixed and purpose-built for financial intake
- No multi-user conflict resolution — last write wins
- No audit trail of changes — HubSpot property history handles this natively
- No PDF export — data lives in HubSpot and can be accessed via reports or the card
- No external integrations (e.g., bank feeds, payroll APIs)

---

## 10. Future Enhancements

| Idea | Notes |
|---|---|
| PDF / print export | Generate a formatted client-facing summary |
| Historical snapshots | Save dated versions of the financial picture over time |
| Deal-level alerts | Trigger HubSpot workflows when DTI exceeds a threshold |
| Benchmarking | Compare client figures against deal-type averages |
| Bulk import | Paste values from a spreadsheet |
