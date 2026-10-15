const { execSync } = require("child_process");

const iconPath = "src/assets/icon/OCW-powered-by-ZM.svg";

// Create the command
const command = `compodoc -p tsconfig.doc.json --customFavicon ${iconPath} --customLogo ${iconPath} --hideGenerator --output public/docs`;

// Execute the command
execSync(command);
