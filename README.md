# Income Expense Calculator

A HubSpot UI Extension that adds an **Income Expense Calculator** CRM card to Deal records. Users can enter income sources and expenses directly on a deal, with automatic totals calculated in real time.

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

All calculated totals (Primary, Spouse, Rental net, Grand Total) update live as the user types.

---

## Project Structure

```
income-expense-calculator/
├── hsproject.json                  # HubSpot project config
├── package.json                    # npm scripts
└── src/
    └── app/
        ├── app.json                # App config (name, scopes)
        ├── package.json            # Extension dependencies
        └── extensions/
            ├── deals-card.json     # Card metadata (location, object type)
            └── deals-card.jsx      # React UI component
```

---

## Requirements

- [Node.js](https://nodejs.org/) v18+
- [HubSpot CLI](https://developers.hubspot.com/docs/platform/developer-tools-overview) v8+
- A HubSpot account with developer access
- A HubSpot Developer Portal (sandbox or production)

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

This will open a browser window to log in and link your HubSpot portal.

### 4. Run locally (dev mode)

```bash
hs project dev
```

This uploads the project to your portal in dev mode. Open a Deal record in HubSpot and navigate to the **Custom** tab to see the card.

---

## Deployment

To deploy to your HubSpot portal:

```bash
hs project upload --account=<YOUR_PORTAL_ID> --force-create
```

Replace `<YOUR_PORTAL_ID>` with your HubSpot portal ID (found in the top-right corner of HubSpot).

---

## Tech Stack

- **[HubSpot UI Extensions](https://developers.hubspot.com/docs/platform/ui-extensions-overview)** — React-based CRM card framework
- **React 18** — UI component library
- **HubSpot CLI v8** — Local development and deployment tooling
- **Platform version:** 2025.1

---

## Configuration

### `hsproject.json`
Defines the project name and platform version.

### `src/app/app.json`
Defines the app name, UID, description, and required OAuth scopes (`crm.objects.deals.read`).

### `src/app/extensions/deals-card.json`
Configures the card title, location (`crm.record.tab`), and the object type it appears on (`deals`).

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
