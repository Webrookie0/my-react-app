import React from 'react';
import { motion } from 'framer-motion';

const Signup = () => {
  return (
    <motion.div initial={{ x: '100vw' }} animate={{ x: 0 }}>
      <h2>Signup</h2>
      <form>
        <input type="text" placeholder="Username" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Signup</button>
      </form>
    </motion.div>
  );
};

export default Signup; 