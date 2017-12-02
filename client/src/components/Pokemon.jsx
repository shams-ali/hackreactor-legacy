import React from 'react';
import css from '../PokemonStats.css';

const Pokemon = (props) => {
  const containerPokemon = {
    position: 'relative'
  };

  const fainted = `${props.health === 0}`;

  let sprite = {
    'position': 'absolute',
    'width': '150px',
    'height': 'auto',
    'top': '10%',
    'left': '50%',
    'transform': 'translate(-50%, -10%)'
  };

  let bkgd = {
    'position': 'absolute',
    'width': '300px',
    'height': 'auto',
    'top': '50%',
    'left': '50%',
    'transform': 'translate(-50%, -50%)'
  };

  if (props.attacking) {
    sprite.paddingLeft = '30px';
    sprite.transition = 'all 0.1s ease-out';
  }

  if (props.isAttacked) {
    sprite.opacity = '0.3';
    sprite.transition = 'all 0.1s linear';
  }

  if (props.gameOver) {
    sprite = {
      'position': 'static',
      'top': 'auto',
      'left': 'auto',
      'transform': 'none'
    };

    bkgd = {
      'display': 'none',
      'position': 'static',
      'top': 'auto',
      'left': 'auto',
      'transform': 'none'
    };
  }

  let test = '';

  if (props.isDead) {
    notDead = css.dead;
  }

  return (
    <div style={containerPokemon}>
      <img style={bkgd} src="/img/bkgd-battle.png"/>
      <img className={notDead} style={sprite} src={props.sprite}/>
    </div>
  );
};

export default Pokemon;
