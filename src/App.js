import React, { useState, useEffect } from "react";
import firebase from "firebase";
import "./styles.css";

const config = {
  apiKey: "AIzaSyCiR99N5UU-01PCI-XdLYyj5pNpELg8vj8",
  authDomain: "math-wizard-8757b.firebaseapp.com",
  databaseURL: "https://math-wizard-8757b.firebaseio.com",
  projectId: "math-wizard-8757b",
  storageBucket: "math-wizard-8757b.appspot.com",
  messagingSenderId: "856233821341",
  appId: "1:856233821341:web:c8ce80b63927d0f92a0074",
  measurementId: "G-8D2FZYMR0M"
};

if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

const db = firebase.database();

export default function App() {
  const [gameDetails, setGameDetails] = useState({
    nr1: null,
    nr2: null,
    sign: null,
    answer: "",
    correctAnswer: null,
    score: 0,
    isWrong: false,
    database: null,
    users: [],
    user: null,
    name: ""
  });

  const getRandomNumber = (size = 1) => {
    const minNr = 1; // +'1'.padEnd(size, '0'); <- this for more complex calculations
    const maxNr = +Array(size).fill(9).join("");
    const nr = Math.floor(Math.random() * (maxNr - minNr + 1) + minNr);
    return nr;
  };

  const getRandomSign = () => {
    const signs = ["+", "-", "*", "/"];
    const idx = Math.floor(Math.random() * signs.length);
    return signs[idx];
  };

  const mathCalculator = {
    "+": (x, y) => x + y,
    "-": (x, y) => x - y,
    "*": (x, y) => x * y,
    "/": (x, y) => x / y
  };

  const createCalculation = (size = 1) => {
    const nr1 = getRandomNumber(size);
    const nr2 = getRandomNumber(size);
    const sign = getRandomSign();
    // const correct_answer = eval(`${nr1} ${sign} ${nr2}`);
    const correctAnswer = mathCalculator[sign](nr1, nr2);

    // Don't allow floating point answers nor Infinity
    if (
      Math.floor(correctAnswer) !== correctAnswer ||
      correctAnswer === Infinity
    ) {
      return createCalculation(size);
    } else {
      setGameDetails((state) => ({
        ...state,
        nr1: nr1,
        nr2: nr2,
        sign: sign,
        correctAnswer: correctAnswer
      }));
    }
  };

  const handleChange = (e) => {
    let value = +e.target.value;
    // convert it to number
    setGameDetails((state) => ({ ...state, answer: value }));
  };

  const updateScoreInDB = (score) => {
    const { user, database } = gameDetails;

    database.child(user.id).update({
      score
    });
  };

  const handleNameChange = (e) => {
    let value = e.target.value;
    setGameDetails((state) => ({
      ...state,
      name: value
    }));
  };

  const handleNameSubmit = (e) => {
    const { name, database } = gameDetails;

    if (!name) return;

    const newUser = {
      score: 0,
      name: name,
      lastUpdated: Date.now(),
      // generating a random id
      id: Math.random().toString().substr(2)
    };

    database.child(newUser.id).set(newUser);

    setGameDetails((state) => ({
      ...state,
      user: newUser
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { score, answer, correctAnswer } = gameDetails;

    // increasing/decreasing the score & difficulty based on how far the user goes
    // score increment = how many digits does his score has <- old one
    // score increment = every 25 points score increment gets doubled
    console.log({ answer, correctAnswer });
    const scoreIncrement = Math.floor(Math.abs(score) / 25) + 1;
    let newScore = null;

    if (correctAnswer === answer) {
      newScore = score + scoreIncrement;
      createCalculation(scoreIncrement);
      setGameDetails((state) => ({
        ...state,
        isWrong: false,
        score: newScore,
        answer: ""
      }));
    } else {
      newScore = score - 1;
      setGameDetails((state) => ({
        ...state,
        isWrong: true,
        score: newScore,
        answer: ""
      }));
    }

    updateScoreInDB(newScore);
  };

  useEffect(() => {
    const database = db.ref("/users");
    console.log({ database });
    setGameDetails((state) => ({ ...state, database: database }));
  }, []);

  const { database } = gameDetails;

  useEffect(() => {
    const { database } = gameDetails;

    if (database) {
      database.on("value", (snapshot) => {
        const users = [];
        const usersObj = snapshot.val();
        if (usersObj) {
          Object.keys(usersObj).forEach((key) => {
            users.push(usersObj[key]);
          });

          setGameDetails((state) => ({ ...state, users: users }));
        }
      });
    }

    if (database) {
      const nr1 = getRandomNumber(1);
      const nr2 = getRandomNumber(1);
      const sign = getRandomSign();
      // const correct_answer = eval(`${nr1} ${sign} ${nr2}`);
      const correctAnswer = mathCalculator[sign](nr1, nr2);

      // Don't allow floating point answers nor Infinity
      if (
        Math.floor(correctAnswer) !== correctAnswer ||
        correctAnswer === Infinity
      ) {
        return createCalculation(1);
      } else {
        setGameDetails((state) => ({
          ...state,
          nr1: nr1,
          nr2: nr2,
          sign: sign,
          correctAnswer: correctAnswer
        }));
      }
    }
  }, [database]);

  useEffect(() => {});

  const {
    name,
    answer,
    nr1,
    nr2,
    sign,
    score,
    isWrong,
    user,
    users,
    correctAnswer
  } = gameDetails;

  return (
    <div className="app">
      <h1>Math Wizz</h1>
      {user && <small className="name">Hello, {user.name}</small>}
      {user ? (
        <div className="row">
          <div className="col-1">
            <form className="form" onSubmit={handleSubmit}>
              <h3>Calculate:</h3>
              <div className="calculation">
                <p className="op">{nr1}</p>
                <p className="op">{sign}</p>
                <p className="op">{nr2}</p>
                <p className="op">=</p>
                <input
                  className={`answer ${isWrong && "wrong"}`}
                  type="number"
                  onChange={handleChange}
                  value={answer}
                  onKeyDown={() => {
                    if (correctAnswer === 0) {
                      setGameDetails((state) => ({ ...state }));
                    } else if (answer === 0) {
                      setGameDetails((state) => ({ ...state, answer: "" }));
                    }
                  }}
                />
              </div>
              <div className="score">Score: {score}</div>
            </form>
          </div>
          <div className="col-2">
            <div className="leaderboard">
              <h3>Leaderboard</h3>
              <ul>
                {users.length > 0 &&
                  users
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                    .map((user, idx) => (
                      <li key={idx}>
                        <span>{user.name}</span>
                        {user.score}
                      </li>
                    ))}
              </ul>
              plat_web
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p>
            Welcome to the Math Wizz game. <br /> Let's test your math skills!{" "}
            <span role="img" aria-label="">
              😃
            </span>{" "}
            <br />
            <br /> You'll be given random math questions that you'll have to
            answer. <br /> Level changes when you reach the score of: 25, 50,
            75...
          </p>
          <p>Please enter your username to start:</p>
          <input type="text" onChange={handleNameChange} value={name} />
          <button className="btn" onClick={handleNameSubmit}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
