const child_process = require("child_process");
const calculateSizeD = (itemFullStaticPath) => {
  const itemFullStaticPathCleaned = itemFullStaticPath.replace(/\s/g, " ");
  const commandOutput = child_process
    .execSync(`du -sh "${itemFullStaticPathCleaned}"`)
    .toString();

  //remove spaces,tabs,etc
  let filesize = commandOutput.replace(/\s/g, " ");

  //split filesize using the "/"
  filesize = filesize.split(" ");
  //human size is the first element of the array
  filesize = filesize[0];

  //unit
  const filesizeUnit = filesize.replace(/\d|\./g, "");

  //size number
  const filesizeNumber = parseFloat(filesize.replace(/[a-z]/i, ""));

  const units = "BKMGT";
  const filesizeBytes =
    filesizeNumber * Math.pow(1000, units.indexOf(filesizeUnit));
  console.log(filesizeBytes);

  return [filesize, filesizeBytes];

  // const cleaned = itemFullStaticPath.replace(/\s/g, " ");
  // try {
  //   const commandOutput = child_process.execSync(`du -sh "${cleaned}"`, {
  //     encoding: "utf-8",
  //   });
  //   // Extract the size and unit using a regular expression
  //   const match = commandOutput.match(/^([\d.]+)([BKMGT])?/);
  //   if (!match) {
  //     throw new Error("Failed to parse du output");
  //   }
  //   const [, numberStr, unit] = match;
  //   const number = parseFloat(numberStr);
  //   if (isNaN(number)) {
  //     throw new Error("Failed to parse numeric part of size");
  //   }
  //   const units = "BKMGT";
  //   const unitIndex = units.indexOf(unit || "B");
  //   if (unitIndex === -1) {
  //     throw new Error(`Invalid unit: ${unit}`);
  //   }
  //   const filesizeBytes = number * 1000 ** unitIndex;
  //   return [`${number}${unit || "B"}`, filesizeBytes];
  // } catch (error) {
  //   console.error(`Error calculating size for "${cleaned}": ${error.message}`);
  //   return [null, null];
  // }
};

module.exports = calculateSizeD;
