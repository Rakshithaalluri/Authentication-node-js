const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(2375, () => {
      console.log("Server successfully running at http://localhost:2375");
    });
  } catch (error) {
    console.log(`Db Server Error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getUserQuery = `SELECT username FROM user WHERE username= '${username}';`;
  const dbResponse = await db.get(getUserQuery);

  if (dbResponse !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUserQuery = `
            INSERT INTO user 
            (username, name, password, gender, location)
            VALUES ('${username}', '${name}', 
            '${hashedPassword}', '${gender}', '${location}');`;
      await db.run(createdUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserDetails = `
    SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(getUserDetails);
  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordCheck = await bcrypt.compare(password, dbResponse.password);
    if (passwordCheck === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getPasswordQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(getPasswordQuery);

  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(
      oldPassword,
      dbResponse.password
    );

    if (comparePassword === true) {
      const lengthOfPassword = newPassword.length;
      if (lengthOfPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `UPDATE user 
                SET password = '${newHashedPassword}'
                WHERE username = '${username}';
                `;
        const user = await db.run(updatePassword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
