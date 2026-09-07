'use strict';

const axios = require('axios');

let newsletterRunning = false;

module.exports = {
  '*/5 * * * *': async ({ strapi }) => {

    if (newsletterRunning) {
      console.log(
        '⚠️ Newsletter already running - skipping this cron.'
      );
      return;
    }

    newsletterRunning = true;

    try {

      console.log('======================================');
      console.log('Running Daily Newsletter...');
      console.log('Cron started:', new Date());

      // ==========================================
      // 1. GET ONLY PUBLISHED + UNSENT ARTICLES
      // ==========================================

      let articles = await strapi.db
        .query('api::article.article')
        .findMany({
          where: {
            publishedAt: {
              $not: null,
            },
            newsletterSent: false,
          },

          orderBy: {
            publishedAt: 'asc',
          },

          populate: {
            featuredImage: true,
            category: true,
          },
        });

      console.log(
        'UNSENT PUBLISHED ARTICLES:',
        articles.length
      );

      // ==========================================
      // STOP IF NOTHING TO SEND
      // ==========================================

      if (articles.length === 0) {

        console.log(
          '❌ NO UNSENT PUBLISHED ARTICLES - NO EMAIL'
        );

        return;
      }

      // ==========================================
      // 2. START 1-MINUTE COLLECTION WINDOW
      // ==========================================

      console.log(
        '⏳ Articles found.'
      );

      console.log(
        '⏳ Waiting 1 minute to collect any additional articles...'
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 60 * 1000);
      });

      console.log(
        '✅ 1-minute collection window finished.'
      );

      // ==========================================
      // 3. RE-FETCH ARTICLES AFTER 1 MINUTE
      // ==========================================

      articles = await strapi.db
        .query('api::article.article')
        .findMany({
          where: {
            publishedAt: {
              $not: null,
            },
            newsletterSent: false,
          },

          orderBy: {
            publishedAt: 'asc',
          },

          populate: {
            featuredImage: true,
            category: true,
          },
        });

      console.log(
        '📦 FINAL UNSENT ARTICLES:',
        articles.length
      );

      if (articles.length === 0) {

        console.log(
          '❌ NO UNSENT ARTICLES AFTER 1-MINUTE WAIT'
        );

        return;
      }

      // ==========================================
      // 4. LOG EXACT ARTICLES
      // ==========================================

      articles.forEach((article) => {

        console.log({
          id: article.id,
          documentId: article.documentId,
          title: article.title,
          slug: article.slug,
          publishedAt: article.publishedAt,
          newsletterSent: article.newsletterSent,
        });

      });

      // ==========================================
      // 5. GET SUBSCRIBERS
      // ==========================================

      const subscribers =
        await strapi.entityService.findMany(
          'api::newsletter-subscriber.newsletter-subscriber',
          {}
        );

      console.log(
        'SUBSCRIBERS:',
        subscribers.length
      );

      if (subscribers.length === 0) {

        console.log(
          '❌ NO SUBSCRIBERS - NO EMAIL SENT'
        );

        return;
      }

      // ==========================================
      // 6. GET ORIGINAL WEBSITE IMAGE
      // ==========================================

      const imageUrl = await getOriginalImageUrl(article);

     
      // ==========================================
      // 7. CREATE ARTICLE CARDS
      // ==========================================

      const articleListParts = [];

      for (const article of articles) {

        const imageUrl = article.featuredImage?.url
  ? article.featuredImage.url.startsWith("http")
    ? article.featuredImage.url
    : `https://api.themartech.info${article.featuredImage.url}`
      : "https://themartech.info/logo.png";

console.log("EMAIL IMAGE:", imageUrl);

        const category =
          article.category?.name ||
          'Martech News';

        const articleUrl =
          `https://themartech.info/${article.slug}`;

        articleListParts.push(`

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    border:1px solid #e5e7eb;
    background:#ffffff;
    margin-bottom:25px;
  "
>

<tr>

<td
  width="30%"
  valign="top"
  style="padding:15px;"
>

<img
  src="${imageUrl}"
  width="180"
  alt="${article.title || 'The Martech'}"
  style="
    display:block;
    width:180px;
    height:auto;
    border:0;
    outline:none;
    text-decoration:none;
  "
>

</td>

<td
  width="70%"
  valign="top"
  style="padding:20px;"
>

<div
  style="
    background:#DBEAFE;
    color:#0B5E94;
    padding:6px 12px;
    font-family:Arial,sans-serif;
    font-size:12px;
    font-weight:bold;
    display:inline-block;
  "
>
${category}
</div>

<h2
  style="
    margin:15px 0 10px 0;
    color:#13294B;
    font-family:Arial,sans-serif;
    font-size:19px;
    line-height:25px;
  "
>
${article.title || 'Latest Martech News'}
</h2>



<table
  cellpadding="0"
  cellspacing="0"
  border="0"
>

<tr>

<td
  bgcolor="#0B5E94"
  style="padding:10px 18px;"
>

<a
  href="${articleUrl}"
  style="
    color:#ffffff;
    font-family:Arial,sans-serif;
    font-size:14px;
    font-weight:bold;
    text-decoration:none;
    display:inline-block;
  "
>
Read More
</a>

</td>

</tr>

</table>

</td>

</tr>

</table>

        `);
      }

      const articleList =
        articleListParts.join('');

      // ==========================================
      // 8. CREATE ONE EMAIL
      // ==========================================

      const html = `

<!DOCTYPE html>

<html>

<head>

<meta
  http-equiv="Content-Type"
  content="text/html; charset=UTF-8"
>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>Today's Martech News</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f6f9;
    font-family:Arial,sans-serif;
  "
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="background:#f4f6f9;"
>

<tr>

<td
  align="center"
  style="padding:30px 10px;"
>

<table
  width="700"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    max-width:700px;
    background:#ffffff;
  "
>

<tr>

<td
  align="center"
  bgcolor="#004B9A"
  style="
    background:#004B9A;
    padding:30px 20px;
  "
>

<h1
  style="
    margin:0;
    color:#ffffff;
    font-family:Arial,sans-serif;
    font-size:42px;
    line-height:48px;
  "
>
Today's Martech News
</h1>

<p
  style="
    margin:10px 0 0 0;
    color:#ffffff;
    font-family:Arial,sans-serif;
    font-size:15px;
    line-height:26px;
  "
>
All the latest articles from Martech, in one place.
</p>

</td>

</tr>

<tr>

<td
  style="
    padding:30px;
    background:#ffffff;
  "
>

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

      console.log(
        '======================================'
      );

      console.log(
        '📧 TOTAL ARTICLES IN ONE EMAIL:',
        articles.length
      );

      console.log(
        '📧 HTML LENGTH:',
        html.length
      );

      // ==========================================
      // 9. SEND ONE EMAIL PER SUBSCRIBER
      // ==========================================

      let allEmailsSent = true;

      for (const subscriber of subscribers) {

        try {

          console.log(
            '📧 Sending newsletter to:',
            subscriber.email
          );

          const response =
            await axios.post(
              'https://api.brevo.com/v3/smtp/email',
              {
                sender: {
                  name: 'The Martech',
                  email:
                    'themartech@themartech.info',
                },

                to: [
                  {
                    email:
                      subscriber.email,
                  },
                ],

                subject:
                  "Today's Martech News",

                htmlContent:
                  html,
              },
              {
                headers: {
                  accept:
                    'application/json',

                  'content-type':
                    'application/json',

                  'api-key':
                    process.env.BREVO_API_KEY,
                },
              }
            );

          console.log(
            '✅ EMAIL SENT:',
            subscriber.email
          );

          console.log(
            'Brevo Response:',
            response.data
          );

        } catch (error) {

          allEmailsSent = false;

          console.error(
            '❌ EMAIL FAILED:',
            subscriber.email
          );

          console.error(
            error.response?.data ||
            error.message
          );
        }
      }

      // ==========================================
      // 10. ONLY MARK TRUE AFTER ALL EMAILS SENT
      // ==========================================

      if (allEmailsSent) {

        console.log(
          '======================================'
        );

        console.log(
          '✅ ALL EMAILS SENT SUCCESSFULLY'
        );

        for (const article of articles) {

          await strapi.entityService.update(
            'api::article.article',
            article.id,
            {
              data: {
                newsletterSent: true,
                newsletterSentAt:
                  new Date(),
              },
            }
          );

          console.log(
            '✅ MARKED TRUE:',
            article.id,
            article.title
          );
        }

        console.log(
          '======================================'
        );

        console.log(
          '✅ ALL ARTICLES MARKED newsletterSent=true'
        );

      } else {

        console.log(
          '======================================'
        );

        console.log(
          '❌ SOME EMAILS FAILED'
        );

        console.log(
          '❌ ARTICLES REMAIN newsletterSent=false'
        );

      }

    } catch (error) {

      console.error(
        '❌ NEWSLETTER ERROR:',
        error.response?.data ||
        error.message ||
        error
      );

    } finally {

      newsletterRunning = false;

      console.log(
        'Newsletter cron finished.'
      );

      console.log(
        '======================================'
      );
    }
  },
};