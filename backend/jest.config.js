const base = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ["ts", "js", "json"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
  coverageProvider: "v8",
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json-summary"],
  collectCoverageFrom: [
    "<rootDir>/src/helpers/**/*.ts",
    "<rootDir>/src/services/**/*.ts",
    "<rootDir>/src/controllers/**/*.ts",
    "!<rootDir>/src/**/*.d.ts"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    "./src/services/DeliveryOrderServices/**/*.ts": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    "./src/helpers/TenantAccess.ts": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    "./src/middleware/isAuth.ts": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};

module.exports = {
  ...base,
  projects: [
    {
      ...base,
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.spec.ts"]
    },
    {
      ...base,
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.spec.ts"],
      setupFilesAfterEnv: [
        "<rootDir>/tests/setup/jest.setup.ts",
        "<rootDir>/tests/setup/integration.setup.ts"
      ],
      maxWorkers: 1
    }
  ]
};
