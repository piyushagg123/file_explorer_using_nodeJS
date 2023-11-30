const fs = require("fs");
const path = require("path");

const calculateSizeD = require("./calculateSizeD");
const calculateSizeF = require("./calculateSizeF");

const buildMainContent = (fullStaticPath, pathname) => {
  let mainContent = "";
  let items;
  //loop through the elements inside the folder
  try {
    items = fs.readdirSync(fullStaticPath);
    console.log(items);
  } catch (err) {
    console.log(err);
    return `
    <div class="alert alert-danger">
        internal server error
    </div>
    `;
  }
  //remove .DS_Store
  items = items.filter((element) => element !== ".DS_Store");
  //home directory , remove project files

  //get the following elements for each item:
  items.forEach((item) => {
    let itemDetails = {};
    itemDetails.name = item;

    //link
    const link = path.join(pathname, item);

    //getting the stats of the item
    const itemFullStaticPath = path.join(fullStaticPath, item);
    try {
      itemDetails.stats = fs.statSync(itemFullStaticPath);
    } catch (err) {
      console.log(`statSync error: ${err}`);
      mainContent = `<div class="alert alert-danger"> Internal Server error</div>`;
      return false;
    }

    if (itemDetails.stats.isDirectory()) {
      itemDetails.icon = '<ion-icon name="folder"></ion-icon>';

      [itemDetails.size, itemDetails.sizeBytes] =
        calculateSizeD(itemFullStaticPath);
    } else if (itemDetails.stats.isFile()) {
      itemDetails.icon = '<ion-icon name="document"></ion-icon>';

      [itemDetails.size, itemDetails.sizeBytes] = calculateSizeF(
        itemDetails.stats
      );
    }

    //when was the file last changed (unix timestamp)
    itemDetails.timeStamp = itemDetails.stats.mtimeMs;

    //convert it to a human readable form
    itemDetails.date = new Date(itemDetails.timeStamp);
    itemDetails.date = itemDetails.date.toLocaleString();

    mainContent += `
    <tr data-name="${itemDetails.name}" data-size="${
      itemDetails.sizeBytes
    }" data-time="${itemDetails.timeStamp}">
        <td style="display: flex;">${
          itemDetails.icon
        }<a href="${link}" target='${
      itemDetails.stats.isFile() ? "_blank" : ""
    }'
    >${item}</a></td>    
        <td>${itemDetails.size}</td>    
        <td>${itemDetails.date}</td>    
    </tr>`;
  });
  //name
  //icon
  //link to the item
  //size
  //last modified

  return mainContent;
};

module.exports = buildMainContent;
