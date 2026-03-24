const hubspot = require("@hubspot/api-client");

exports.main = async (context, sendResponse) => {
  const { data, objectId } = context.parameters;

  try {
    const token = process.env.PRIVATE_APP_ACCESS_TOKEN || context.secrets?.PRIVATE_APP_ACCESS_TOKEN;
    const hubspotClient = new hubspot.Client({
      accessToken: token,
    });

    await hubspotClient.crm.deals.basicApi.update(objectId, {
      properties: {
        source_of_income_calculator: JSON.stringify(data),
      },
    });

    sendResponse({ status: "success" });
  } catch (error) {
    sendResponse({ status: "error", message: error.message });
  }
};
