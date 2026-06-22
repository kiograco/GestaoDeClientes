import { readFile } from "fs/promises";
import path from "path";
import Mustache from "mustache";

const ALLOWED_TEMPLATES = [
  "order-service",
  "inspection-report",
  "password-reset",
  "password-changed",
  "financial-notification",
  "welcome",
  "operational-notification"
] as const;

export type EmailTemplateName = typeof ALLOWED_TEMPLATES[number];

export const renderEmailTemplate = async (
  name: EmailTemplateName,
  variables: Record<string, unknown>
): Promise<string> => {
  if (!ALLOWED_TEMPLATES.includes(name)) throw new Error("Template invalido");
  const source = await readFile(
    path.resolve(__dirname, "../../email_templates", `${name}.html`),
    "utf8"
  );
  return Mustache.render(source, variables);
};
