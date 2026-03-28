const axios = require("axios");

exports.main = async ({ parameters }) => {
  const { objectId } = parameters;
  const token = process.env.PRIVATE_APP_ACCESS_TOKEN;

  if (!token) return { income: null, expenses: null, assets: null, error: "Token not set" };
  if (!objectId) return { income: null, expenses: null, assets: null, error: "objectId missing" };

  try {
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/deals/${objectId}?properties=source_of_income_calculator,source_of_expenses_calculator,source_of_assets_calculator`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const props = response.data.properties;
    return {
      income: props.source_of_income_calculator || null,
      expenses: props.source_of_expenses_calculator || null,
      assets: props.source_of_assets_calculator || null,
    };
  } catch (err) {
    return {
      income: null, expenses: null, assets: null,
      error: err.response?.data?.message || err.message || String(err),
    };
  }
};
