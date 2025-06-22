import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => (
  <header>
    <nav>
      <Link to="/dashboard">Dashboard</Link> | 
      <Link to="/profile">Profile</Link> | 
      <Link to="/mentors">Mentors</Link> | 
      <Link to="/requests">Requests</Link> | 
      <Link to="/sessions">Sessions</Link>
    </nav>
  </header>
);

export default Header;
