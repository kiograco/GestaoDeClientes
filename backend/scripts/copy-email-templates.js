const fs = require("fs");
const path = require("path");

const source = path.resolve(__dirname, "../src/email_templates");
const destination = path.resolve(__dirname, "../dist/email_templates");
fs.mkdirSync(destination, { recursive: true });
fs.readdirSync(source)
  .filter(file => file.endsWith(".html"))
  .forEach(file => fs.copyFileSync(path.join(source, file), path.join(destination, file)));
