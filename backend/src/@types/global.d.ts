// Payloads from legacy integrations are intentionally untyped until their contracts are modeled.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyAny = any;

declare namespace NodeJS {
  interface Global {
    _loopDb: LegacyAny;
    rabbitWhatsapp: LegacyAny;
  }
}
