'use strict';

const axios = require('axios');

module.exports = {
  '30 13 * * *': async ({ strapi }) => {
    try {
      console.log('Running Daily Newsletter...');
      console.log('Cron started:', new Date());

     const articles = await strapi.entityService.findMany(
  'api::article.article',
  {
    filters: {
      publishedAt: {
        $notNull: true,
      },
      newsletterSent: false,
    },
    populate: {
      featuredImage: true,
      category: true,
    },
    sort: {
      publishedAt: 'desc',
    },
  }
);

console.log("All articles:", articles);

articles.forEach(article => {
  console.log({
    title: article.title,
    publishedAt: article.publishedAt,
    newsletterSent: article.newsletterSent,
  });
});


if (!articles.length) {
  console.log('No new articles to send.');
  return;
}

      const subscribers = await strapi.entityService.findMany(
  'api::newsletter-subscriber.newsletter-subscriber',
  {}
);

console.log("Subscribers:", subscribers.length);

if (!subscribers.length) {
  console.log("No subscribers found");
  return;
}

      // CREATE ARTICLE CARDS
      const articleList = articles
  .map((article) => {
    const imageUrl = article.featuredImage?.url
  ? article.featuredImage.url.startsWith("http")
    ? article.featuredImage.url
    : `https://api.theinfotech.info${article.featuredImage.url}`
  : "https://theinfotech.info/logo.png";

console.log("EMAIL IMAGE:", imageUrl);



    const description =
  article.excerpt ||
  article.description ||
  "";

    return `
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          border:1px solid #e5e7eb;
          border-radius:10px;
          margin-bottom:25px;
          background:#ffffff;
        "
      >
        <tr>

          <!-- LEFT IMAGE -->
          <td width="30%" style="padding:15px;vertical-align:top;">
        <img
  src="${imageUrl}"
  width="180"
  style="
    display:block;
    width:180px;
    max-width:180px;
    height:auto;
    border-radius:8px;
  "
/>
          </td>

          <!-- RIGHT CONTENT -->
          <td width="70%" style="padding:20px;vertical-align:top;">

            <div
              style="
                display:inline-block;
                background:#DBEAFE;
                color:#0B5E94;
                padding:6px 12px;
                border-radius:4px;
                font-size:12px;
                font-weight:bold;
                margin-bottom:15px;
              "
            >
              ${article.category?.name || "Infotech News"}
            </div>

            <h2
              style="
                margin:0 0 15px;
                color:#13294B;
                font-size:19px;
                line-height:25px;
                word-break:break-word;
              "
            >
              ${article.title}
            </h2>

            <p
              style="
                color:#5b6472;
                font-size:14px;
                line-height:22px;
                margin-bottom:25px;
              "
            >
              ${description}
            </p>

            <a
              href="https://theinfotech.info/${article.slug}"
              style="
                background:#0B5E94;
                color:#fff;
                text-decoration:none;
                padding:12px 24px;
                border-radius:6px;
                display:inline-block;
                font-weight:bold;
              "
            >
              Read More
            </a>

          </td>

        </tr>
      </table>
    `;
  })
  .join("");

      // NEWSLETTER WRAPPER
     const html = `
<!DOCTYPE html>
<html>
<body
  style="
    margin:0;
    padding:30px;
    background:#f4f6f9;
    font-family:Arial,sans-serif;
  "
>

<table width="100%">
<tr>
<td align="center">

<table
  width="700"
  cellpadding="0"
  cellspacing="0"
  style="
    width:100%;
    max-width:700px;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
  "
>

<tr>
<td
  align="center"
  style="
    background:#004B9A;
    padding:30px 20px;
  "
>
<h1
  style="
    color:#ffffff;
    margin:0;
    font-size:48px;
    line-height:44px;
  "
>
Today's Infotech News 
</h1>

<p
  style="
    color:#ffffff;
    margin:10px 0 0;
    font-size:15px;
    line-height:26px;
  "
>
All the latest articles from Infotech, in one place.
</p>
</td>
</tr>

<tr>
<td style="padding:30px;">
${articleList}
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

console.log("Articles:", articles.length);


     // SEND EMAILS
console.log("Articles:", articles.length);
console.log("Subscribers:", subscribers.length);
console.log("Starting to send emails...");

let allEmailsSent = true;

for (const subscriber of subscribers) {
  try {
    console.log("Sending to:", subscriber.email);

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'The Infotech',
          email: 'theinfotech@theinfotech.info',
        },
        to: [
          {
            email: subscriber.email,
          },
        ],
        subject: "Today's Infotech News",
        htmlContent: html,
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
      }
    );

    console.log("✅ Sent to:", subscriber.email);
    console.log("Brevo Response:", response.data);

  } catch (error) {
  allEmailsSent = false;

  console.error("❌ Failed:", subscriber.email);
  console.error(error.response?.data || error.message);
}
}
// MARK ARTICLES AS SENT ONLY IF ALL EMAILS WERE SENT
if (allEmailsSent) {
  for (const article of articles) {
    await strapi.entityService.update(
      'api::article.article',
      article.id,
      {
        data: {
          newsletterSent: true,
          newsletterSentAt: new Date(),
        },
      }
    );

    console.log("Updated:", article.title);
  }

  console.log("✅ All articles marked as sent.");
} else {
  console.log("❌ Some emails failed. Articles were NOT marked as sent.");
}

    } catch (err) {
      console.error('Newsletter Error:', err.response?.data || err);
    }
  },
};