import React from 'react';
import css from '../PokemonStats.css';

const Pokemon = (props) => {
  let notDead = '';
  let attack = '';
  let attackImg = '';
  let attackType = {
    'position': 'absolute',
    'top': '50%',
    'left': '50%',
    'transform': 'translate(-50%, -50%)'
  };

  const containerPokemon = {
    position: 'relative'
  };

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

    props.types.forEach((type, index) => {
      if (type === 'water') {
        attackImg = '/img/attack-water.png';
      } else if (type === 'electric') {
        attackImg = '/img/attack-electric.png';
      } else if (type === 'bug' || type === 'grass') {
      } else if (type === 'ground' || type === 'rock') {
      } else if (type === 'dragon') {
      } else if (type === 'fighting') {
      } else if (type === 'fire') {
      } else if (type === 'flying') {
      } else if (type === 'ghost') {
      } else if (type === 'ice') {
      } else if (type === 'poison') {
      } else if (type === 'psychic') {
      } else if (type === 'normal') {
      }
      attack = css.attack;
    });
  } else if (props.isAttacked) {
    notDead = css.isAttacked;
  }

  if (props.isDead) {
    notDead = css.dead;
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

  return (
    <div style={containerPokemon}>
      <img style={bkgd} src="/img/bkgd-battle.png"/>
      <img className={attack} style={attackType} src={attackImg}/>
      <img className={notDead} style={sprite} src={props.sprite}/>
    </div>
  );
};

export default Pokemon;
