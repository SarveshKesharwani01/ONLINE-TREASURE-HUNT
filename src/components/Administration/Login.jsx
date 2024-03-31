import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link,useNavigate } from 'react-router-dom';
import './Login.css';
// const BASE_URL=process.env.BASE_URL;

const Login = () => {
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
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  axios.defaults.withCredentials = true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    try {
      const response = await axios.post('https://localhost:3001/Login', formData);
        console.log('Login response:', response);
        if(response.data.status){
          // Redirect to dashboard or another page upon successful login
          navigate('/Countdown');
        }
        else{
          setLoginError("Login failed. Please check your credentials.");
        }
    } catch (error) {
      console.error('Error during login:', error);
      setLoginError("Error during login. Please try again later.");
    }
  };

  useEffect(() => {
    axios.get('https://localhost:3001/Login').then((response) => {
      if (response.data.loggedIn == true) {
        setLoginError(response.data.user);
      }
    }).catch((error) => {
      console.error('Error fetching user data:', error);
    });
  }, []);

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title"></h2>
        <form action="/Login" method="POST" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="background"></div>
        <div className="login-sun"></div>
      </div>
    </div>
  );
};

export default Login;