import React, { Component } from 'react';
import css from '../PokemonStats.css';

const PokemonStats = (props) => {
  let damage = props.stats.health / props.stats.initialHealth;

  let healthPoints = {
    'height': '20px',
    'width': '200px',
    'background': '#54645E', // grey
    'borderRadius': '20px'
  };

  let healthDamage = {
    'height': '20px',
    'width': `${damage * 100}%`,
    'background': '#6EF9A8', // green
  };

  if (damage === 1) {
    healthDamage.borderRadius = '20px';
  } else if (damage >= 0.95 && damage <= 1) {
    healthDamage.borderRadius = '20px 0 0 20px';
  } else if (damage >= 0.45 && damage <= 0.65) {
    healthDamage.background = '#F8DE33'; // orange
    healthDamage.transition = 'all 0.7s ease';
    healthDamage.borderRadius = '20px 0 0 20px';
  } else if (damage >= 0 && damage <= 0.45) {
    healthDamage.background = '#FB4F43'; // red
    healthDamage.transition = 'all 0.3s ease';
    healthDamage.borderRadius = '20px 0 0 20px';
  }

  return (
    <div className={css.stats}>
      <div className={css.pokemonName}>{props.stats.name.toUpperCase()}</div>

      <div className={css.healthBar}>
        <div className={css.healthName}>HP</div>

        <div className={css.healthPoints} style={healthPoints}>
          <div className={css.healthDamage} style={healthDamage}></div>
        </div>
      </div>

<<<<<<< HEAD
      <div style={{marginBottom: '2px'}}> {props.stats.health} / {props.stats.initialHealth} </div>
=======
      <div>{props.stats.health} / {props.stats.initialHealth}</div>
>>>>>>> 4dcd8a2c735a75c535f7d87752155933ecc17078
    </div>
  );
};

export default PokemonStats;
