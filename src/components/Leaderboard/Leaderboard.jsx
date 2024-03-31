import React, {useState,useEffect} from 'react';
import axios from "axios";
import './Leaderboard.css'; // Import CSS for styling
// const BASE_URL=process.env.BASE_URL;

const Leaderboard = () => {
  useEffect(() => {
    // Create stars dynamically
    const container = document.querySelector('.background');
    const numStars = 100; // Adjust number of stars as needed
    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      star.style.top = `${Math.random() * 100}%`; // Randomize star position vertically
      star.style.left = `${Math.random() * 100}%`; // Randomize star position horizontally
      container.appendChild(star);
    }
  }, []);

  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      const response = await axios.get('https://online-treasure-hunt-s53t.onrender.com/Leaderboard');
      setLeaderboardData(response.data.leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    }
  };

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Leaderboard</h1>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Time Stamp</th>
            <th>Questions Answered</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((entry, index) => (
            <tr key={entry.username}>
              <td>{index + 1}</td>
              <td>{entry.username}</td>
              <td>
                {new Date(entry.first_correct_answer_timestamp).toLocaleString()}
              </td>
              <td>{entry.last_answered_question_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="background"></div>
    </div>
  );
};

export default Leaderboard;
