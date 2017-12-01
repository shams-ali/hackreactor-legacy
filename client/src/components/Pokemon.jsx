import React from 'react';

const Pokemon = (props) => {
  const containerPokemon = {
    position: 'relative'
  };

  const pokemon = {
    sprite: {
      'position': 'absolute',
      'top': '25%',
      'left': '50%',
      'transform': 'translate(-50%, -25%)'
    },
    background: {
      position: 'absolute',
      'top': '50%',
      'left': '50%',
      'transform': 'translate(-50%, -50%)'
    }
  };

  if (props.attacking) {
    pokemon.sprite.paddingLeft = '30px';
    pokemon.sprite.transition = 'all 0.1s ease-out';
  }

  if (props.gameOver) {
    pokemon.sprite = {
      'position': 'static',
      'top': 'auto',
      'left': 'auto',
      'transform': 'none'
    };

    pokemon.background = {
      'display': 'none',
      'position': 'static',
      'top': 'auto',
      'left': 'auto',
      'transform': 'none'
    };
  }

  return (
    <div style={containerPokemon}>
      <img style={pokemon.background} src="/img/bkgd-battle.png"/>
      <img style={pokemon.sprite} src={props.sprite}/>
    </div>
  );
};

export default Pokemon;
