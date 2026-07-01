// module.exports = {};

module.exports = ({ env }) => ({
  'export-import-strapi5-plugin': {
    enabled: true,
    config: {
      entities: {
        'api::contact-submission.contact-submission': {
          fields: [
            'title',
            'slug',
            'description',
            'publishedAt',
          ],
        },

        'api::media-kit-lead.media-kit-lead': {
          fields: [
            'name',
            'slug',
          ],
        },

        'api::newsletter-subscriber.newsletter-subscriber': {
          fields: [
            'name',
            'email',
          ],
        },
      },
    },
  },
});