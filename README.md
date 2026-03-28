# Income Expense Calculator

A HubSpot UI Extension that adds a **Financial Calculator** CRM card to Deal records. The card has three tabs — Monthly Income, Monthly Expenses, and Assets — allowing users to capture a complete financial picture directly on a deal. All values auto-save on every change and persist across page refreshes.

---

## Tabs Overview

### Monthly Income
Calculates total monthly income across all sources.

| Section | Fields |
|---|---|
| Primary Taxpayer | Wages + Social Security + Pension(s) |
| Spouse/Other Contributors | Wages + Social Security + Pension(s) |
| Dividends - Interest | Single input |
| Rental | Rental Income − Rental Expenses |
| Distributions (K-1) | Single input |
| Alimony | Single input |
| Child Support | Single input |
| Other (Rent subsidy, Oil credit, etc.) | Single input |
| Other Income (×2) | Single inputs |

---

### Monthly Expenses
Captures monthly expenses across five categories with section and grand totals.

| Section | Fields |
|---|---|
| Food, Clothing & Miscellaneous | Food, Housekeeping Supplies, Apparel & Services, Personal Care, Miscellaneous |
| Housing and Utilities | 1st/2nd Lien Mortgage, Rent, Homeowner Insurance, Property Tax, Gas, Electricity, Water, Cable/Internet/Phone, Other |
| Transportation | Vehicle Payments ×2, Car Insurance, Gas & Oil, Parking & Tolls, Public Transportation |
| Health Care | Health Insurance, Out-of-Pocket Medical, Prescription Drugs |
| Other Monthly Expenses | Child/Dependent Care, Life Insurance, Other |

---

### Assets
Captures personal asset values with quick sale percentage and loan balance to calculate net equity.

| Asset | Fields |
|---|---|
| Bank Accounts | Market Value → Equity |
| Cash on Hand | Market Value → Equity |
| Investments, Life Insurance, Retirement, Real Estate, Vehicles ×4, Personal Effects, Other | Market Value + Quick Sale % (100/80/70/60/50) + Loan → Equity |

**Equity formula:** `Market Value × Quick Sale% − Loan`

---

## How Data is Stored

Each tab saves its data as a JSON string to a dedicated HubSpot Deal property:

| Tab | Property Name |
|---|---|
| Monthly Income | `source_of_income_calculator` |
| Monthly Expenses | `source_of_expenses_calculator` |
| Assets | `source_of_assets_calculator` |

All three properties are loaded in a single API call when the card opens.

---

## Project Structure

```
income-expense-calculator/
├── hsproject.json                        # HubSpot project config (platform 2025.1)
├── package.json                          # npm scripts
└── src/
    └── app/
        ├── app.json                      # App config (name, scopes)
        ├── package.json                  # App-level dependencies
        ├── app.functions/
        │   ├── serverless.json          # Registers serverless functions (required)
        │   ├── package.json             # Function dependencies (axios)
        │   ├── loadIncomeData.js        # Loads all three properties in one API call
        │   └── saveIncomeProperty.js    # Saves JSON data to a specified deal property
        └── extensions/
            ├── package.json             # Extension dependencies
            ├── deals-card.json          # Card metadata (location, object type)
            └── deals-card.jsx           # React UI — three-tab financial calculator
```

---

## Requirements

- [Node.js](https://nodejs.org/) v18+
- [HubSpot CLI](https://developers.hubspot.com/docs/platform/developer-tools-overview) v8+
- A HubSpot account with developer access
- Three custom Deal properties (type: **Multi-line text**):
  - `source_of_income_calculator`
  - `source_of_expenses_calculator`
  - `source_of_assets_calculator`

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Opeid/income-expense-calculator.git
cd income-expense-calculator
```

### 2. Install the HubSpot CLI

```bash
npm install -g @hubspot/cli
```

### 3. Authenticate with HubSpot

```bash
hs auth
```

### 4. Add the private app secret

The serverless functions need your private app access token to read and write deal properties. After deploying, go to **HubSpot Settings → Private Apps → Income Expenses Calculator → Auth tab** and copy the token, then run:

```bash
hs secrets add PRIVATE_APP_ACCESS_TOKEN --account=<YOUR_PORTAL_ID>
```

Then push an empty commit to trigger a redeploy so the secret is picked up:

```bash
git commit --allow-empty -m "Load secret" && git push
```

### 5. Run locally (dev mode)

```bash
hs project dev
```

Open a Deal record in HubSpot and navigate to the **Income Expense Calculator** tab to see the card.

---

## Deployment

This project is linked to the `income-expense-calculator` GitHub repository. Any push to the `main` branch automatically triggers a build and deploy in HubSpot.

To deploy manually:

```bash
hs project upload --account=<YOUR_PORTAL_ID>
```

Check build status at:
`app.hubspot.com/developer-projects/<PORTAL_ID>/project/hubspot-deals-extension/activity`

---

## Tech Stack

- **[HubSpot UI Extensions](https://developers.hubspot.com/docs/platform/ui-extensions-overview)** — React-based CRM card framework
- **[axios](https://www.npmjs.com/package/axios)** — HTTP client used in serverless functions
- **React 18** — UI component library
- **HubSpot CLI v8** — Local development and deployment tooling
- **Platform version:** 2025.1

---

## Configuration

### `hsproject.json`
Defines the project name and platform version (2025.1).

### `src/app/app.json`
Defines the app name, UID, description, and required OAuth scopes (`crm.objects.deals.read`, `crm.objects.deals.write`).

### `src/app/app.functions/serverless.json`
**Required.** Registers all serverless functions with HubSpot. Without this file, functions are not recognized.

### `src/app/app.functions/loadIncomeData.js`
Loads all three deal properties (`source_of_income_calculator`, `source_of_expenses_calculator`, `source_of_assets_calculator`) in a single API call and returns them to the card on mount.

### `src/app/app.functions/saveIncomeProperty.js`
Accepts a `propertyName`, `data` object, and `objectId`. Stringifies the data as JSON and saves it to the specified deal property via the HubSpot API.

### `src/app/extensions/deals-card.json`
Configures the card title, location (`crm.record.tab`), and the object type (`deals`).

### `src/app/extensions/deals-card.jsx`
Main React component. Contains three tab components (`IncomeTab`, `ExpensesTab`, `AssetsTab`), shared load/save logic, and a loading spinner shown while data is being fetched.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT
