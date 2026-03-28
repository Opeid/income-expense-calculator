# HubSpot UI Extension — Build Playbook

A reference guide for building HubSpot UI Extensions with serverless functions and persistent CRM property storage. Follow this exactly to avoid the mistakes learned during initial setup.

---

## Stack

- HubSpot CLI v8+
- Platform version: **2025.1**
- UI: `@hubspot/ui-extensions` + React 18
- Serverless: Node.js + `axios`
- Data: JSON blob stored in a single CRM property

---

## Project Structure (Copy This Exactly)

```
my-project/
├── hsproject.json
├── package.json
└── src/
    └── app/
        ├── app.json
        ├── package.json
        ├── app.functions/
        │   ├── serverless.json          ← REQUIRED — registers functions
        │   ├── package.json             ← use axios, NOT @hubspot/api-client
        │   └── myFunction.js            ← one file per function
        └── extensions/
            ├── package.json
            ├── my-card.json
            └── my-card.jsx
```

---

## File Templates

### `hsproject.json`
```json
{
  "name": "my-project-name",
  "srcDir": "src",
  "platformVersion": "2025.1"
}
```

---

### `src/app/app.json`
```json
{
  "name": "My App",
  "uid": "my-app",
  "description": "What this app does",
  "scopes": ["crm.objects.deals.read", "crm.objects.deals.write"],
  "public": false,
  "extensions": {
    "crm": {
      "cards": [
        { "file": "extensions/my-card.json" }
      ]
    }
  }
}
```

> **Note:** Do NOT add a `functions` key to `app.json`. Functions are registered via `app.functions/serverless.json`.

---

### `src/app/app.functions/serverless.json`
```json
{
  "appFunctions": {
    "myFunction": {
      "file": "myFunction.js"
    }
  }
}
```

> This is the file that makes HubSpot recognize the serverless function. Without it, the function does not exist as far as HubSpot is concerned.

---

### `src/app/app.functions/package.json`
```json
{
  "name": "my-project-functions",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

> Use `axios` for HTTP calls. Do NOT use `@hubspot/api-client` — it causes build issues.

---

### `src/app/app.functions/myFunction.js`
```js
const axios = require("axios");

exports.main = async ({ parameters }) => {
  const { data, objectId } = parameters;
  const token = process.env.PRIVATE_APP_ACCESS_TOKEN;

  if (!token) return { status: "error", message: "PRIVATE_APP_ACCESS_TOKEN is not set" };
  if (!objectId) return { status: "error", message: "objectId is missing" };

  try {
    await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/deals/${objectId}`,
      { properties: { my_property_name: JSON.stringify(data) } },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return { status: "success" };
  } catch (err) {
    return {
      status: "error",
      message: err.response?.data?.message || err.message || String(err),
    };
  }
};
```

> - Use `exports.main = async ({ parameters }) =>` — destructure context directly
> - **Return** the result, do NOT use `sendResponse`
> - Access the secret via `process.env.PRIVATE_APP_ACCESS_TOKEN`

---

### `src/app/extensions/my-card.json`
```json
{
  "type": "crm-card",
  "data": {
    "title": "My Card Title",
    "location": "crm.record.tab",
    "module": {
      "file": "my-card.jsx"
    },
    "objectTypes": [
      {
        "name": "deals",
        "propertiesToSend": ["my_property_name"]
      }
    ]
  }
}
```

> - `propertiesToSend` loads the property value into `context.crm.objectProperties` on card open
> - Do NOT add `serverlessFunctions` here — that is handled by `serverless.json`

---

### `src/app/extensions/package.json`
```json
{
  "name": "my-project-extension",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@hubspot/ui-extensions": "^0.12.3",
    "react": "^18.2.0"
  }
}
```

---

### `src/app/extensions/my-card.jsx` (pattern)
```jsx
import { useState } from "react";
import { hubspot, Flex, Text, NumberInput, Divider, Alert } from "@hubspot/ui-extensions";

hubspot.extend(({ context, runServerlessFunction }) => (
  <MyCard context={context} runServerlessFunction={runServerlessFunction} />
));

const parseStored = (raw) => {
  try { return JSON.parse(raw || "{}"); }
  catch { return {}; }
};

const MyCard = ({ context, runServerlessFunction }) => {
  const objectId = context.crm.objectId;
  const raw = context.crm.objectProperties?.my_property_name;

  const [values, setValues] = useState(() => ({ field1: 0, field2: 0, ...parseStored(raw) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (key, val) => {
    const updated = { ...values, [key]: val };
    setValues(updated);
    setSaving(true);
    setError(null);

    runServerlessFunction({
      name: "myFunction",
      parameters: { data: updated, objectId },
      callback: ({ response }) => {
        setSaving(false);
        if (response?.status === "error") setError(response.message);
      },
    });
  };

  return (
    <Flex direction="column" gap="sm">
      {error && <Alert title="Error" variant="error">{error}</Alert>}
      {saving && <Text format={{ color: "medium" }}>Saving...</Text>}
      <NumberInput
        label="Field 1"
        name="field1"
        value={values.field1}
        onChange={(val) => handleChange("field1", val)}
        prefix="$"
      />
    </Flex>
  );
};
```

---

## Data Persistence Pattern

Store all card values in a **single CRM property as a JSON string**. This avoids creating many individual HubSpot properties.

1. Create one **Multi-line text** (textarea) property in HubSpot
2. On card load: call a `loadData` serverless function via `useEffect` — do NOT use `propertiesToSend`
3. On every field change: call a `saveData` serverless function with the full values object

### Why not `propertiesToSend`?
`propertiesToSend` loads property values into `context.crm.objectProperties` at card render time, but it is unreliable for properties written by serverless functions. Always use a dedicated load function instead.

### Load pattern (JSX)

Use `actions.fetchCrmObjectProperties` — do NOT use `runServerlessFunction` for loading. The serverless function callback never fires when called from `useEffect`, but `fetchCrmObjectProperties` works reliably.

```jsx
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <MyCard context={context} runServerlessFunction={runServerlessFunction} actions={actions} />
));

// Inside component:
useEffect(() => {
  actions.fetchCrmObjectProperties(["my_property_name"]).then((fetched) => {
    if (fetched.my_property_name)
      setValues(parseStored(fetched.my_property_name, DEFAULTS));
  }).catch(() => {});
}, []);
```

> **Critical:** `runServerlessFunction` callbacks never fire when called from `useEffect` on mount. Only call `runServerlessFunction` from user event handlers (onChange, onClick, etc.). For reading data on load, always use `actions.fetchCrmObjectProperties`.

---

## Deployment Steps

### First-time setup

```bash
# 1. Install CLI
npm install -g @hubspot/cli

# 2. Authenticate
hs auth

# 3. Deploy
hs project upload --account=<PORTAL_ID> --force-create

# 4. Add private app secret (one time — get token from HubSpot Settings → Private Apps → your app → Auth tab)
hs secrets add PRIVATE_APP_ACCESS_TOKEN --account=<PORTAL_ID>

# 5. Redeploy to load the secret
hs project upload --account=<PORTAL_ID>
```

### GitHub-connected deploys (recommended)

Once the project is linked to a GitHub repo in HubSpot:
- Every push to `main` auto-triggers a build and deploy
- No manual `hs project upload` needed
- Check status at: `app.hubspot.com/developer-projects/<PORTAL_ID>/project/<PROJECT_NAME>/activity`

> **Important:** If you add a new secret via `hs secrets add`, push an empty commit to trigger a redeploy so the function picks up the new secret:
> ```bash
> git commit --allow-empty -m "Trigger redeploy" && git push
> ```

---

## Common Mistakes & Fixes

| Mistake | Fix |
|---|---|
| Missing `serverless.json` in `app.functions/` | Add it — without it HubSpot ignores all functions |
| Using `@hubspot/api-client` in functions | Switch to `axios` |
| Using `sendResponse(data)` in function | Use `return data` instead |
| Adding `functions` key to `app.json` | Remove it — functions are auto-discovered via `serverless.json` |
| Adding `serverlessFunctions` to card JSON | Remove it — not needed when using `serverless.json` |
| Wrong property type for JSON storage | Use `textarea` (Multi-line text), not `number` |
| Using `propertiesToSend` to load data | Use a `loadData` serverless function + `useEffect` instead |
| Secret not picked up after `hs secrets add` | Push an empty commit to trigger a redeploy |
| Platform version `2023.2` | Upgrade to `2025.1` — older version is deprecated |

---

## Checking Function Logs

```bash
# After deploying, check if function is recognized
hs project logs --function=myFunction --latest

# Tail logs live
hs project logs --function=myFunction --tail
```

---

## HubSpot API — Useful Endpoints

```js
// Update a deal property
await axios.patch(
  `https://api.hubapi.com/crm/v3/objects/deals/${objectId}`,
  { properties: { property_name: value } },
  { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
);

// Read a deal property
await axios.get(
  `https://api.hubapi.com/crm/v3/objects/deals/${objectId}?properties=property_name`,
  { headers: { Authorization: `Bearer ${token}` } }
);

// Update a contact property
await axios.patch(
  `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
  { properties: { property_name: value } },
  { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
);
```
