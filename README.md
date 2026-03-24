# Income Expense Calculator

A HubSpot UI Extension that adds an **Income Expense Calculator** CRM card to Deal records. Users can enter income sources and expenses directly on a deal, with automatic totals calculated in real time. All values are persisted to the deal record and survive page refreshes.

---

## Preview

The card appears on HubSpot Deal records and includes the following income sources:

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

All calculated totals (Primary, Spouse, Rental net, Grand Total) update live as the user types. Values auto-save on every change and reload automatically when the card is opened.

---

## How Data is Stored

All field values are serialized as a single JSON string and saved to a custom HubSpot Deal property named `source_of_income_calculator`. This keeps the data self-contained on the deal record without requiring multiple individual properties.

---

## Project Structure

```
income-expense-calculator/
├── hsproject.json                        # HubSpot project config (platform 2025.1)
├── package.json                          # npm scripts
└── src/
    └── app/
        ├── app.json                      # App config (name, scopes, functions)
        ├── package.json                  # App-level dependencies
        ├── app.functions/
        │   ├── package.json             # Serverless function dependencies
        │   └── saveIncomeProperty.js    # Saves JSON data to deal property
        └── extensions/
            ├── package.json             # Extension dependencies
            ├── deals-card.json          # Card metadata (location, object type, properties)
            └── deals-card.jsx           # React UI component
```

---

## Requirements

- [Node.js](https://nodejs.org/) v18+
- [HubSpot CLI](https://developers.hubspot.com/docs/platform/developer-tools-overview) v8+
- A HubSpot account with developer access
- A custom Deal property named `source_of_income_calculator` (type: Single-line text)

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

The serverless function needs your private app access token to write data back to HubSpot. After deploying, go to **HubSpot Settings → Private Apps → Income Expenses Calculator → Auth tab** and copy the token, then run:

```bash
hs secrets add PRIVATE_APP_ACCESS_TOKEN --account=<YOUR_PORTAL_ID>
```

### 5. Run locally (dev mode)

```bash
hs project dev
```

Open a Deal record in HubSpot and navigate to the **Custom** tab to see the card.

---

## Deployment

This project is linked to the `income-expense-calculator` GitHub repository. Any push to the `main` branch automatically triggers a build and deploy in HubSpot.

To deploy manually:

```bash
hs project upload --account=<YOUR_PORTAL_ID>
```

---

## Tech Stack

- **[HubSpot UI Extensions](https://developers.hubspot.com/docs/platform/ui-extensions-overview)** — React-based CRM card framework
- **[@hubspot/api-client](https://www.npmjs.com/package/@hubspot/api-client)** — HubSpot Node.js API client (used in serverless function)
- **React 18** — UI component library
- **HubSpot CLI v8** — Local development and deployment tooling
- **Platform version:** 2025.1

---

## Configuration

### `hsproject.json`
Defines the project name and platform version (2025.1).

### `src/app/app.json`
Defines the app name, UID, description, required OAuth scopes (`crm.objects.deals.read`, `crm.objects.deals.write`), and registers the serverless function.

### `src/app/extensions/deals-card.json`
Configures the card title, location (`crm.record.tab`), the object type (`deals`), the property to load (`source_of_income_calculator`), and the serverless function reference.

### `src/app/app.functions/saveIncomeProperty.js`
Serverless function that receives the full income data object and writes it as JSON to the `source_of_income_calculator` deal property via the HubSpot API.

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
