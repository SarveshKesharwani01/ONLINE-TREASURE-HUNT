import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QuestionPage.css'; // Import CSS file
// const BASE_URL=process.env.BASE_URL;

const QuestionPage = () => {
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

  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  // Fetch the next question from the server when the component mounts
  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const fetchNextQuestion = async () => {
    try {
      console.log("Fetching next question...");
      const response = await axios.get('http://localhost:3001/questions', { withCredentials: true });
      console.log("Response:", response.data); // Log response data
      if (response.data.message) {
        setQuestion(null);
        setFeedback(response.data.message);
      } else {
        setQuestion(response.data);
        setFeedback('');
      }
    } catch (error) {
      console.error('Error fetching next question:', error);
    }
  };
  
  
  const handleAnswerSubmit = async () => {
    try {
      const response = await axios.post(
        `http://localhost:3001/questions/${question.id}/answer`,
        { answer },
        { withCredentials: true }
      );
      if (response.data.correct) {
        setFeedback('Correct! Moving to the next question.');
        setAnswer('');
        // Introduce a delay before fetching the next question
        fetchNextQuestion(); // Adjust delay time as needed
        console.log("question fetched")
      } else {
        setFeedback('Incorrect. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setFeedback('An error occurred. Please try again.');
    }
  };  

  return (
    <div className="container">
    <div className="question-container">
      {question ? (
        <div>
          <h1 className="question-title">Question {question.id}</h1>
          <p className="question-text">{question.question_text}</p>
          {/* Optionally display an image if available */}
          {question.image_url && (
           <img 
            src={question.image_url} 
            alt="Question"
            className="question-image"
            onError={(e) => console.error('Error loading image: ', question.image_url )}
           />
           )}
           <div class="input-container">
            <input 
                type="text" 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)} 
                className="answer-input"
                placeholder="Type your answer here..." 
            />
            <button onClick={handleAnswerSubmit} className="submit-button">Submit</button>
          </div>
          <p className="feedback-message">{feedback}</p>
        </div>
      ) : (
        // Display the feedback message if no more questions are available
        <p className="feedback-message">{feedback}</p>
      )}
      <div className="background"></div>
    </div>
    </div>
  );
};

export default QuestionPage;
