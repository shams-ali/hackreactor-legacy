import React, { Component } from 'react';
import css from '../styles.css';


const PokemonStats = (props) => {
  let barWidth = '50px';
  let hpWidth = '50px';

  return (
    <div className={css.stats}>
      <h2>{props.stats.name.toUpperCase()}</h2>
      <div
        // style={}
        className={css.hpBar}>
        <div
          className={css.hp}
          style={{width: width}}>
        </div>
      </div>
      <h4 style={{marginBottom: '2px'}}> {props.stats.health} / {props.stats.initialHealth} </h4>
      <h6 style={{marginTop: '5px'}}> atk: {props.stats.attack} - def: {props.stats.defense} </h6>
    </div>
  )
}

export default PokemonStats;
