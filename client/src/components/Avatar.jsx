import React from 'react';
import styles from '../avatar.css';

const Avatar = ({ name, style, direction }) => (
  <div key={name} className={styles[`player-${direction}-animate`]} style={style}></div>
);

export default Avatar;
