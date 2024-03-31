import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { Link,useNavigate } from 'react-router-dom'; // Import Link from react-router-dom
import './SignUp.css';
// const BASE_URL=process.env.BASE_URL;

const SignUp = () => {
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

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    try {
      const response = await axios.post('https://localhost:3001/SignUp', formData);
        console.log("Server response:",response.data.status);
        navigate('/Login');
      // Reset form after successful signup
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error during signup:', error);
    }
  };
  

  return (
    <div className="signup-container">
      <h2 className="signup-title"></h2>
      <form action="/SignUp" method="POST" className="signup-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            placeholder='MIS@branch.iiitp.ac.in'
            name="email"
            value={formData.email}
            onChange={handleChange}
            //pattern= "^[\w-]+(\.[\w-]+)*@(gmail\.com|cse\.iiitp\.ac\.in|ece\.iiitp\.ac\.in)$"
            title="Please enter a valid email address"
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            minLength="8"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            minLength="8"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <div className="background"></div>
      <div className="signup-sun"></div>
    </div>
  );
};

export default SignUp;