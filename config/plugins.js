// module.exports = {};

module.exports = ({ env }) => ({
  'export-import-strapi5-plugin': {
    enabled: true,
    config: {
      entities: {
        'api::contact-submission.contact-submission': {
          fields: [
            'id',
            'firstName',
            'lastName',
             'email',
             'phone',   
             'message',
             'createdAt'
          ],
        },

        'api::write-for-us-submission.write-for-us-submission': {
          fields: [
            'id',
            'fullName',
            'email',
            'topic',
            'approvalStatus',
            'createdAt'
          ],
        },

        'api::newsletter-subscriber.newsletter-subscriber': {
          fields: [
             'id',
             'email',
             'newsletter_status',
             'createdAt'
          ],
        },
      },
    },
  },
});