async function sendNewsletter(subject, htmlContent) {
    try {
      // Create Campaign
      const createResponse = await fetch(
        "https://api.brevo.com/v3/emailCampaigns",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            name: subject,
          
            subject: `📰 ${subject}`,
          
            previewText: "Read the latest article from TheInfotech",
          
            htmlContent: htmlContent,
          
            sender: {
              name: "TheInfotech",
              email: process.env.BREVO_SENDER,
            },
          
            recipients: {
              listIds: [Number(process.env.BREVO_LIST_ID)],
            },
          }),
        }
      );
  
      const campaign = await createResponse.json();
  
      console.log("BREVO CAMPAIGN:", campaign);
  
      if (!campaign.id) {
        console.error("Campaign creation failed");
        return null;
      }
  
      // Send Campaign Immediately
      const sendResponse = await fetch(
        `https://api.brevo.com/v3/emailCampaigns/${campaign.id}/sendNow`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
        }
      );
  
      console.log("SEND STATUS:", sendResponse.status);
  
      const sendText = await sendResponse.text();
      console.log("SEND RESPONSE:", sendText);
  
      if (sendResponse.status !== 204) {
        console.error("Campaign send failed");
      }
  
      return campaign;
    } catch (error) {
      console.error("NEWSLETTER ERROR:", error);
      return null;
    }
  }
  
  module.exports = sendNewsletter;