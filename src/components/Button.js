import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick }) => {
  return (
    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClick}>
      {children}
    </motion.button>
  );
};

export default Button; 