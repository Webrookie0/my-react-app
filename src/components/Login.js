import React from 'react';
import { motion } from 'framer-motion';

const Login = () => {
  return (
    <motion.div initial={{ x: '-100vw' }} animate={{ x: 0 }}>
      <h2>Login</h2>
      <form>
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </motion.div>
  );
};

export default Login; 