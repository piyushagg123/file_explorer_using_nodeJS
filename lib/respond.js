//require node modules
const url = require("url");
const path = require("path");
const fs = require("fs");

// file imports
const buildBreadcrumb = require("./breadcrumb");
const buildMainContent = require("./mainContent");
const getMimeType = require("./getMimeType");
const { error } = require("console");

//static base path: location of your static folder
const staticBasePath = path.join(__dirname, "..", "static");

// respond to a request
// following is function passed to createServer in app.js
const respond = (request, response) => {
  // before working with the pathname, you need to decode it
  let pathname = url.parse(request.url, true).pathname;

  //if favicon.ico , stop
  if (pathname === "/favicon.ico") {
    return false;
  }
  pathname = decodeURIComponent(pathname);

  // get the corresponding full static path located in the static folder
  const fullStaticPath = path.join(staticBasePath, pathname);

  // can we find something in fullStaticPath?
  // NO : send "404: file not found!!"
  if (!fs.existsSync(fullStaticPath)) {
    console.log(`${fullStaticPath} doesnt exist`);
    response.write("404: file not found");
    response.end();
    return false;
  }
  // we found something
  // is it a file or directory
  let stats;
  try {
    stats = fs.lstatSync(fullStaticPath);
  } catch (err) {
    console.log(`lstatsync Error: ${err}`);
  }

  //  it is a directory:
  if (stats.isDirectory()) {
    //  get content from the template index.html
    let data = fs.readFileSync(
      path.join(staticBasePath, "project_files/index.html"),
      "utf-8"
    );
    // build the page title
    console.log(pathname);
    let pathElements = pathname.split("/").reverse();
    pathElements = pathElements.filter((element) => element !== "");
    let folderName = pathElements[0];
    if (folderName === undefined) {
      folderName = "Home";
    }

    // build breadcrumb
    const breadcrumb = buildBreadcrumb(pathname);

    // build table rows (main content)
    const mainContent = buildMainContent(fullStaticPath, pathname);
    // fill the template data with : the page title, breadcrumb and table rows
    // print data to the webpage
    data = data.replace("Page title", folderName);
    data = data.replace("pathname", breadcrumb);
    data = data.replace("mainContent", mainContent);
    response.statusCode = 200;
    response.write(data);
    return response.end();
  }

  // it is not a directory but not a file either
  // send : 401: access denied!!!
  if (!stats.isFile()) {
    response.statusCode = 401;
    response.write("401: Access Denied!");
    console.log("not a file!");
    return response.end();
  }

  // it is a file
  // lets get the file extension
  let fileDetails = {};
  fileDetails.extname = path.extname(fullStaticPath);

  //file size
  let stat;
  try {
    stat = fs.statSync(fullStaticPath);
  } catch (err) {
    console.log(`err: ${err}`);
  }
  fileDetails.size = stat.size;

  // get the file mime type and add it to the response header
  getMimeType(fileDetails.extname)
    .then((mime) => {
      //store header here
      let head = {};
      let options = {};
      //response status code
      let statusCode = 200;

      // set "content-type" for all file types
      head["Content-Type"] = mime;

      // get the file size and add it to the response header
      // pdf file? -> display in browser
      if (fileDetails.extname === ".pdf") {
        head["Content-Disposition"] = "inline ";

        //if you want to make pdf file downloadable
        // head["Content-Disposition"] = "attachment; filename=file.pdf";
      }
      // audio/video file? -> stream in ranges
      if (RegExp("audio").test(mime) || RegExp("video").test(mime)) {
        //header
        head["Accept-Ranges"] = "bytes";
        const range = request.headers.range;
        if (range) {
          const start_end = range.replace(/bytes=/, "").split("-");
          const start = parseInt(start_end[0]);
          const end = start_end[1]
            ? parseInt(start_end[1])
            : fileDetails.size - 1;

          head["Content-Range"] = `bytes ${start}-${end}/${fileDetails.size}`;
          head["Content-Length"] = end - start + 1;
          statusCode = 206;

          //options
          options = { start, end };
        }
      }
      // all other file streams in normal way

      //reading the file using fs.readFile

      // fs.promises
      //   .readFile(fullStaticPath, "utf-8")
      //   .then((data) => {
      //     response.writeHead(statusCode, head);
      //     response.write(data);
      //     return response.end();
      //   })
      //   .catch((error) => {
      //     console.log(error);
      //     response.statusCode = 404;
      //     response.write("404: File reading error");
      //     return response.end();
      //   });

      //streaming method:
      const fileStream = fs.createReadStream(fullStaticPath, options);

      //stream chunks to your response object
      response.writeHead(statusCode, head);
      fileStream.pipe(response);

      //events : close and error
      fileStream.on("close", () => {
        return response.end();
      });
      fileStream.on("error", (error) => {
        console.log(error.code);
        response.statusCode = 404;
        response.write("404: FileStream error");
        return response.end();
      });
    })
    .catch((err) => {
      response.statusCode = 500;
      response.write("500: internal server error!");
      console.log(`promise error: ${err}`);
      return response.end();
    });
};

module.exports = respond;
