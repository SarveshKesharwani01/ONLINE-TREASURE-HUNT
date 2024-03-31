import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import pg from "pg";
import bcrypt from "bcrypt";
//import passport from "passport";
import session from "express-session";
import env from "dotenv";
import cors from "cors";



const app = express();
app.use(express.json())
app.use(
  cors({
    origin: ["http://localhost:3000","https://master--onlinetreasurehunt.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
// app.use(function(req, res, next) {
//   // res.header("Access-Control-Allow-Origin", "*");
//   const allowedOrigins = ['http://localhost:3000', 'https://66070d5c0798463d4bd9c713--magical-puffpuff-b5ca65.netlify.app/', 'https://66070d5c0798463d4bd9c713--magical-puffpuff-b5ca65.netlify.app/'];
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//        res.setHeader('Access-Control-Allow-Origin', origin);
//   }
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//   res.header("Access-Control-Allow-credentials", true);
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, UPDATE");
//   next();
//     });
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://master--onlinetreasurehunt.netlify.app"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.port || 3001;
const saltRounds = 10;
env.config();

const sessionOptions = {
  secret: "TOPSECRETWORD",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 72 * 60 * 60 * 1000, // 72 hrs
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production', // Enable this if using HTTPS
    // sameSite: "strict",
  }
};

// Check if the environment is production and if so, set the secure flag for cookies
if (process.env.NODE_ENV === 'production') {
  sessionOptions.cookie.secure = true;
}

app.use(session(sessionOptions));

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// app.use(passport.initialize());
// app.use(passport.session());

// Database configuration
const db = new pg.Client(process.env.DB_URL,{
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
    ssl: {
      rejectUnauthorized: true,
      // Other SSL/TLS options can be specified here if needed
  }
});
db.connect();

// Middleware function to initialize user progress in session
const initializeUserProgress = (req, res, next) => {
  if (!req.session.userProgress) {
    req.session.userProgress = {};
  }

  const userId = req.session.userId;

  if (!req.session.userProgress[userId]) {
    req.session.userProgress[userId] = {}; // Initialize progress for the user if it doesn't exist
  }

  next();
};

app.use(initializeUserProgress);

const requireLogin = (req, res, next) => {
  console.log(req.session)
  console.log(req.session.userId)
  if (!req.session.userId) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  next();
};

app.get("/Login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});

// Routes
app.post("/Login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;

      const match = await bcrypt.compare(password, storedHashedPassword);
        if (match) {
          req.session.userId = user.user_id;
          req.session.userProgress[user.user_id] = req.session.userProgress[user.user_id] || {};
          req.session.user = user;
          
          console.log("userId assigned to session:", req.session.userId);     
          res.send({status:true, userId: user.id});
        } else {
          console.log("this is error",err);
          res.send({status:false});
          res.send({ message: "Wrong username/password combination!" });
        }
    } else {
      res.send({ message: "User doesn't exist" });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/SignUp", async (req, res) => {
  const username=req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    
    if (checkResult.rows.length > 0) {
      console.log("User already exists. Redirecting to login...");
      res.send({status:true});
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *`,
            [username, email, hash]
            );
            const user = result.rows[0];          
            if (err) {
              console.error("Error logging in:", err);
            } else {
              console.log("Success");
              res.send({status:true});
            }
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
});

// Middleware function to check if user is logged in
// const requireLogin = (req, res, next) => {
//   if (!req.session.userId) {
//     return res.status(401).send({ error: "Unauthorized" });
//   }
//   next();
// };

// Define route to fetch questions  requireLogin,
app.get("/questions", initializeUserProgress, async (req, res) => {
  try {
    // Retrieve user's ID from the session
    console.log("Request session: " ,req.session)
    const userId = req.session.userId;
    console.log("User ID:", userId);

    // Retrieve user's progress from the session
    const userProgress = req.session.userProgress[userId] || {};
    console.log("User Progress:", userProgress);

    // Retrieve the last answered question ID from the users table
    const lastAnsweredQuestionResult = await db.query(
      "SELECT last_answered_question_id FROM users WHERE user_id = $1",
      [userId]
    );
    const lastAnsweredQuestionId = lastAnsweredQuestionResult.rows[0]?.last_answered_question_id;
    console.log("Last Answered Question ID:", lastAnsweredQuestionId);

    // Find the next unanswered question ID, starting from the last answered question
    let nextQuestionId;
    if (lastAnsweredQuestionId !== null && lastAnsweredQuestionId !== undefined) {
      const nextQuestionResult = await db.query(
        "SELECT id FROM questions WHERE id > $1 AND id NOT IN (SELECT last_answered_question_id FROM users WHERE user_id = $2) ORDER BY id LIMIT 1",
        [lastAnsweredQuestionId, userId]
      );
      if (nextQuestionResult.rows.length > 0) {
        nextQuestionId = nextQuestionResult.rows[0].id;
      }
    } else {
      // If no last answered question ID is found, start from the first question
      const firstQuestionResult = await db.query(
        "SELECT id FROM questions ORDER BY id LIMIT 1"
      );
      if (firstQuestionResult.rows.length > 0) {
        nextQuestionId = firstQuestionResult.rows[0].id;
      }
    }
    console.log("Next Question ID:", nextQuestionId);

    if (!nextQuestionId) {
      // If there's no next unanswered question, return an appropriate response
      console.log("No next question found. Congratulations message sent.");
      return res.json({ message: "Congratulations! You have answered all the questions." });
    }

    // Retrieve the details of the next question from the database
    const nextQuestionResult = await db.query(
      "SELECT id, question_text, image_url, correct_answer FROM questions WHERE id = $1",
      [nextQuestionId]
    );
    const nextQuestion = nextQuestionResult.rows[0];
    console.log("Next Question:", nextQuestion);

    // Send the details of the next question
    res.json(nextQuestion);
  } catch (err) {
    console.error("Error fetching next question:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// Add this function to update the last_correct_answer_timestamp in the users table
const updateLastCorrectAnswerTimestamp = async (userId, userAnswer) => {
  try {
    // Fetch the user's last answered question ID
    const queryResult = await db.query(
      "SELECT last_answered_question_id FROM users WHERE user_id = $1",
      [userId]
    );
    console.log("Query Result:", queryResult.rows);

    if (queryResult.rows.length > 0) {
      const lastAnsweredQuestionId = queryResult.rows[0].last_answered_question_id;
      console.log("Last Answered Question ID:", lastAnsweredQuestionId);

      if (lastAnsweredQuestionId !== null && lastAnsweredQuestionId !== undefined) {
        // Fetch the correct answer for the last answered question
        const correctAnswerResult = await db.query(
          "SELECT correct_answer FROM questions WHERE id = $1",
          [lastAnsweredQuestionId]
        );
        console.log("Correct Answer Result:", correctAnswerResult.rows);

        const correctAnswer = correctAnswerResult.rows[0].correct_answer.toLowerCase();
        console.log("Correct Answer:", correctAnswer);

        // Update the last_correct_answer_timestamp if the user's answer was correct
        if (userAnswer.toLowerCase() === correctAnswer) {
          await db.query(
            "UPDATE users SET last_correct_answer_timestamp = CURRENT_TIMESTAMP WHERE user_id = $1",
            [userId]
          );
          console.log("Last correct answer timestamp updated successfully.");
        }
      }
    }
  } catch (error) {
    console.error("Error updating last_correct_answer_timestamp:", error);
    // Handle the error
  }
};




// Modify the route for handling answer submission to call the function for updating timestamp
app.post("/questions/:questionId/answer", async (req, res) => {
  const { questionId } = req.params;
  const userId = req.session.userId;

  try {
    console.log("Handling answer submission...");

    const result = await db.query(
      "SELECT correct_answer FROM questions WHERE id = $1",
      [questionId]
    );
    console.log("Query Result:", result.rows);

    const correctAnswer = result.rows[0].correct_answer.toLowerCase();
    console.log("Correct Answer:", correctAnswer);

    const userAnswer = req.body.answer.toLowerCase();
    console.log("User Answer:", userAnswer);

    if (userAnswer === correctAnswer) {
      // Update user progress and timestamp
      req.session.userProgress[questionId] = true;
      await db.query(
        "UPDATE users SET last_answered_question_id = $1 WHERE user_id = $2",
        [questionId, userId]
      );
      console.log("User progress and timestamp updated successfully.");

      // Call function to update timestamp
      await updateLastCorrectAnswerTimestamp(userId, userAnswer);
      console.log("Last correct answer timestamp updated successfully.");

      res.json({ correct: true });
    } else {
      res.json({ correct: false });
    }
  } catch (error) {
    console.error("Error handling answer:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// Route to fetch leaderboard data
app.get("/Leaderboard", async (req, res) => {
  try {
    // SQL query to retrieve leaderboard data
    const query = `
      SELECT 
        username,
        last_answered_question_id,
        MIN(last_correct_answer_timestamp) AS first_correct_answer_timestamp
      FROM 
        users
      WHERE 
        last_correct_answer_timestamp IS NOT NULL
      GROUP BY 
        username, last_answered_question_id
      ORDER BY 
        last_answered_question_id DESC, 
        first_correct_answer_timestamp ASC
      LIMIT 10 
    `;

    // Execute the query
    const result = await db.query(query);

    // Assign ranks to the leaderboard entries
    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      last_answered_question_id: row.last_answered_question_id,
      first_correct_answer_timestamp: row.first_correct_answer_timestamp,
    }));

    // Send the leaderboard data as a response
    res.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});



// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});