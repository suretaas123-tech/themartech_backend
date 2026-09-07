const axios = require("axios");

module.exports = {
  async subscribe(ctx) {
    try {
      const { email } = ctx.request.body;

      if (!email) {
        return ctx.badRequest("Email is required");
      }

      const response = await axios.post(
        "https://api.brevo.com/v3/contacts",
        {
          email,
          updateEnabled: true,
          listIds: [7] // Newsletter_subscribers list ID
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Contact added to Brevo:", email);
      console.log("Brevo Response:", response.data);

      return ctx.send({
        success: true,
        message: "Subscribed successfully"
      });

    } catch (error) {
      console.error(
        "Brevo Error:",
        error.response?.status,
        error.response?.data || error.message
      );

      return ctx.badRequest(
        error.response?.data || error.message
      );
    }
  }
};