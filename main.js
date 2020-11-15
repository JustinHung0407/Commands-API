const express = require("express");
const process = require("child_process");
const extfs = require("fs-extra");
const fs = require("fs");
const app = express();
const listen = "0.0.0.0";
const port = 3000;

const WORKDIR = "workdir";

// TODO 
// 1. filetype
// 2. response message
// 3. error code


const initWorkDir = (path) => {
  const dir = __dirname + "/" + path;

  if (fs.existsSync(dir)) {
    console.log(dir + " existed.");
    return;
  }

  fs.mkdirSync(dir);
  console.log(dir + " created.");
  return;
};

initWorkDir(WORKDIR);

console.log("workdir initialized, ready to start.");

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

const resToJson = (status, payload) => {
  const json = {
    status: status,
    message: payload.toString(),
  };
  return json;
};

app.get("/", (req, res) => {
  res.send("ok");
});

app.post("/cmd", (req, res) => {
  // payload example
  // {
  //     "project": "aaaa",
  //     "eval": "ls -al"
  // }

  let current = req.body.project;

  if (current === undefined || current === "") {
    current = WORKDIR;
  }

  let regexp = "^[^/.]+$";

  if (!current.match(regexp)) {
    res.send(resToJson(0, "path not allowed."));
  } else {
    initWorkDir(current);
    console.log("current working at " + current);

    try {
      const result = process.execSync(req.body.eval, {
        cwd: current,
      });

      res.send(resToJson(0, result));
    } catch (e) {
      res.send(resToJson(500, e.message));
    }
  }
});

app.post("/upload", (req, res) => {
  // payload example
  // {
  //     "fileDir": "aaaa",
  //     "filename": "test"
  //     "content": "content"
  // }

  let content = req.body.content;

  let fileDir = req.body.fileDir;
  let filename = req.body.filename;

  if (fileDir === undefined || fileDir === "") {
    fileDir = WORKDIR;
  }

  let regexp = "^[^.]+$";

  if (!fileDir.match(regexp) || !filename.match("^[^./]+$")) {
    res.send(resToJson(405, "path/filename not allowed."));
  } else {
    console.log("current working at " + fileDir);

    extfs.ensureDirSync(__dirname + "/" + fileDir + "/");

    fs.writeFileSync(
      __dirname + "/" + fileDir + "/" + filename + ".txt",
      content
    );

    res.send(resToJson(0, "File created."));
  }
});

app.listen(port, listen, () => {
  console.log(`Command API listening at http://${listen}:${port}`);
});
