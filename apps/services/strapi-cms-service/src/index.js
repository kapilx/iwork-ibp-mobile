module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    console.log('🚀 Strapi bootstrap: Initializing default templates...');

    try {
      // Create default company template (companyId: "0")
      const defaultCompanyExists = await strapi.db
        .query('api::company-template.company-template')
        .findOne({
          where: { companyId: "0" },
        });

      if (!defaultCompanyExists) {
        await strapi.entityService.create(
          'api::company-template.company-template',
          {
            data: {
              companyId: "0",
              config: {
                infoPoints: [
                  'Complete your enrollment before the deadline',
                  'Add your dependents if applicable',
                  'Review all policy documents carefully',
                  'Update your contact information if needed',
                ],
                disclaimerNotes:
                  'Please ensure all information provided is accurate and up-to-date. Contact your HR department for any assistance during the enrollment process.',
              },
              publishedAt: new Date(),
            },
          }
        );
        console.log('✅ Default company template created (companyId: "0")');
      } else {
        console.log('ℹ️  Default company template already exists');
      }

      // Create default policy template (companyId: "0", policyId: "0")
      const defaultPolicyExists = await strapi.db
        .query('api::policy-template.policy-template')
        .findOne({
          where: { companyId: "0", policyId: "0" },
        });

      if (!defaultPolicyExists) {
        await strapi.entityService.create(
          'api::policy-template.policy-template',
          {
            data: {
              companyId: "0",
              policyId: "0",
              config: {
                compulsory: [],
                optional: [],
                flex: [],
                policyFeaturesDoc: null,
                showCompanyContribution: true,
                autoLockEnrollmentAfterConfirm: false,
                requireConfirmationBeforeSubmit: true,
                disclaimerNotes:
                  'This is your default policy information. Please review carefully before proceeding with enrollment. All details are subject to terms and conditions.',
              },
              publishedAt: new Date(),
            },
          }
        );
        console.log('✅ Default policy template created (companyId: "0", policyId: "0")');
      } else {
        console.log('ℹ️  Default policy template already exists');
      }

      console.log('✅ Bootstrap completed successfully');
    } catch (error) {
      console.error('❌ Error during bootstrap:', error);
    }
  },
};
