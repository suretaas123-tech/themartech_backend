"use strict";

const { Parser } = require("json2csv");

module.exports = {
  async exportSelected(ctx) {
    try {
      const { collection, ids } = ctx.request.body;

      const collections = {
        "newsletter-subscriber":
          "api::newsletter-subscriber.newsletter-subscriber",
        "contact-submission":
          "api::contact-submission.contact-submission",
        "media-kit-lead":
          "api::media-kit-lead.media-kit-lead",
      };

      const uid = collections[collection];

      if (!uid) {
        return ctx.badRequest("Invalid collection");
      }

      let filters = {};

      if (ids && ids.length > 0) {
        filters.documentId = {
          $in: ids,
        };
      }

      const data = await strapi.documents(uid).findMany({
        filters: {
          documentId: {
            $in: ids,
          },
        },
        status: "published",
      });

      console.log("Export Data:", data);

      if (!data.length) {
        return ctx.badRequest("No data found.");
      }

      const parser = new Parser();

      const csv = parser.parse(data);

      ctx.set("Content-Type", "text/csv");
      ctx.set(
        "Content-Disposition",
        `attachment; filename=${collection}.csv`
      );

      ctx.body = "\uFEFF" + csv;
    } catch (err) {
      console.error(err);
      ctx.throw(500, err);
    }
  },
};