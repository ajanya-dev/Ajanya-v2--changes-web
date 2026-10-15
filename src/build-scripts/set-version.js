/**
 * @description This npm script file is used just before build to update version number
 */
const fs = require("fs");
const path = require("path");

// Get the environment file name from command-line argument
const environmentFileName = process.argv[2];
const commitHash = process.argv[3];

// Check if the environment file name is provided
if (!environmentFileName) {
  console.error(
    "Please provide the environment file name as a command-line argument."
  );
  process.exit(1);
}

// Define the path to the environment files
const environmentPath = "src/environments";
// Define the path to the version file
const versionPath = "src/version.json";

// Get the full path to the environment file
const filePath = path.join(environmentPath, environmentFileName);

// Check if the environment file exists
if (!fs.existsSync(filePath)) {
  console.error(`Environment file '${environmentFileName}' does not exist.`);
  process.exit(1);
}

// Read the content of the environment file
const fileContent = fs.readFileSync(filePath, "utf8");
//  Read the content of the version file
const versionContent = fs.readFileSync(versionPath, "utf8");
// Parse the JSON content
const versionData = JSON.parse(versionContent);

// Extract the environment ID from the file content
const environmentIdRegex = /env_id:\s*['"]([^'"]+)['"]/g;
const environmentIdMatch = environmentIdRegex.exec(fileContent);
const environmentId = environmentIdMatch ? environmentIdMatch[1] : "";
// Get the current version number from the file content
const versionRegex = /version:\s*['"]([^'"]+)['"]/g;
const currentVersionMatch = versionRegex.exec(fileContent);
const currentVersion = currentVersionMatch ? currentVersionMatch[1] : "";
const updatedVersion =
  currentVersion +
  " " +
  getDate() +
  getTime() +
  "[" +
  commitHash +
  "][" +
  environmentId +
  "]";
// Update the "version" field
versionData.version = updatedVersion;
// Convert the JSON object back to string with formatting
const updatedVersionContent = JSON.stringify(versionData, null, 2);

// Update the version property in the file content
const updatedFileContent = fileContent.replace(
  versionRegex,
  `version: '${updatedVersion}'`
);

// Write the updated content back to the environment file
fs.writeFileSync(filePath, updatedFileContent, "utf8");

// Write the updated version content back to the file
fs.writeFileSync(versionPath, updatedVersionContent, "utf8");

console.log(
  `Version number set to ${updatedVersion} in ${environmentFileName}`
);

function getDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `[${year}-${month}-${day}]`;
}

// Helper function to get the current time in the format [HH:MM:SS]
function getTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `[${hours}:${minutes}:${seconds}]`;
}
