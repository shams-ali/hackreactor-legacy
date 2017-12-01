import React from 'react';
import css from '../styles.css';

const Pokemon = (props) => {
  const classes = () => {
    if (props.attacking) {
      return css.attackAnimation;
    } else {
      return css.staticAnimation;
    }
  };

  let bkgdBattle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };

  let sprite = {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -30%)'
  };

  let containerPokemon = {
    position: 'relative'
  };

  return (
    <div style={containerPokemon}>
      <img style={bkgdBattle} src="/img/bkgd-battle.png"/>
      <img className={classes()} src={props.sprite} style={sprite}/>
    </div>
  );
};

export default Pokemon;
