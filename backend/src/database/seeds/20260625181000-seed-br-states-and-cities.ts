import { QueryInterface } from "sequelize";
import brLocations from "./data/br-states-cities.json";

interface StateSeed {
  ibgeCode: number;
  uf: string;
  name: string;
}

interface CitySeed {
  ibgeCode: number;
  name: string;
  stateIbgeCode: number;
  uf: string;
}

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();
    const states = brLocations.states as StateSeed[];
    const cities = brLocations.cities as CitySeed[];

    await queryInterface.bulkInsert(
      "States",
      states.map(state => ({
        ibgeCode: state.ibgeCode,
        uf: state.uf,
        name: state.name,
        status: "active",
        createdAt: now,
        updatedAt: now
      })),
      { ignoreDuplicates: true } as LegacyAny
    );

    const stateRows = (await queryInterface.sequelize.query(
      'SELECT id, "ibgeCode" FROM "States"'
    )) as LegacyAny;
    const stateIdByIbgeCode = new Map<number, number>(
      stateRows[0].map((state: { id: number; ibgeCode: number }) => [
        Number(state.ibgeCode),
        Number(state.id)
      ])
    );

    await queryInterface.bulkInsert(
      "Cities",
      cities.map(city => ({
        stateId: stateIdByIbgeCode.get(city.stateIbgeCode),
        ibgeCode: city.ibgeCode,
        name: city.name,
        uf: city.uf,
        status: "active",
        createdAt: now,
        updatedAt: now
      })),
      { ignoreDuplicates: true } as LegacyAny
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("Cities", {}, {});
    await queryInterface.bulkDelete("States", {}, {});
  }
};
