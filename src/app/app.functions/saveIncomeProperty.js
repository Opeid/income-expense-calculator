const axios = require("axios");

exports.main = async ({ parameters }) => {
  const { data, objectId } = parameters;
  const token = process.env.PRIVATE_APP_ACCESS_TOKEN;

  if (!token) {
    return { status: "error", message: "PRIVATE_APP_ACCESS_TOKEN is not set" };
  }
  if (!objectId) {
    return { status: "error", message: "objectId is missing" };
  }

  try {
    await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/deals/${objectId}`,
      { properties: { source_of_income_calculator: JSON.stringify(data) } },
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
