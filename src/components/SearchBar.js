import React from 'react';
import { motion } from 'framer-motion';

const SearchBar = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <input type="text" placeholder="Search..." />
      <button>Search</button>
    </motion.div>
  );
};

export default SearchBar; 