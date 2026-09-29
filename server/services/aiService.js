const axios = require("axios");

const getAIServiceHealth = async () => {
  const aiServiceUrl = process.env.AI_SERVICE_URL;

  if (!aiServiceUrl) {
    throw new Error("AI_SERVICE_URL is not configured.");
  }

  const response = await axios.get(`${aiServiceUrl}/health`, {
    timeout: 5000,
  });

  return response.data;
};

module.exports = {
  getAIServiceHealth,
};
