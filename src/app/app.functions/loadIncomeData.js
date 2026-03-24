const axios = require("axios");

exports.main = async ({ parameters }) => {
  const { objectId } = parameters;
  const token = process.env.PRIVATE_APP_ACCESS_TOKEN;

  if (!token) return { data: null, error: "PRIVATE_APP_ACCESS_TOKEN is not set" };
  if (!objectId) return { data: null, error: "objectId is missing" };

  try {
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/deals/${objectId}?properties=source_of_income_calculator`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { data: response.data.properties.source_of_income_calculator || null };
  } catch (err) {
    return {
      data: null,
      error: err.response?.data?.message || err.message || String(err),
    };
  }
};
