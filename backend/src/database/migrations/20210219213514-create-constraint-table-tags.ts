import { QueryInterface } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addConstraint("Tags", {
        fields: ["tag", "tenantId"],
        type: "unique",
        name: "unique_constraint_tag_tenant"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeConstraint("Tags", "unique_constraint_tag_tenant")
    ]);
  }
};
