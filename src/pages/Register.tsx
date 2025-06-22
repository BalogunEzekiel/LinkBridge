import React, { useState } from 'react';
import api from '../api';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'mentee' });

  const handleRegister = async () => {
    await api.post('/auth/register', form);
    alert('Registered successfully');
  };

  return (
    <div>
      <h2>Register</h2>
      <input placeholder="Name" onChange={e => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Password" type="password" onChange={e => setForm({ ...form, password: e.target.value })} />
      <select onChange={e => setForm({ ...form, role: e.target.value })}>
        <option value="mentee">Mentee</option>
        <option value="mentor">Mentor</option>
      </select>
      <button onClick={handleRegister}>Register</button>
    </div>
  );
};

export default Register;
