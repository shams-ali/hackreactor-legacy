import React, { Component } from 'react';
import Pokemon from './Pokemon.jsx';
import PokemonStats from './PokemonStats.jsx';
import css from '../styles.css';

const GameView = (props) => {
  return (
    <div className={css.battleField}>
      <div className={css.pokeView}>
        <PokemonStats stats={props.opponent.pokemon[0]} />
        <Pokemon types={props.opponent.pokemon[0].types} sprite={props.opponent.pokemon[0].sprites.front_default} type='opponent' isAttacked={props.attacking} isDead={props.opponent.pokemon[0].health === 0}/>
      </div>

      <div className={css.pokeView}>
        <Pokemon types={props.pokemon[0].types} sprite={props.pokemon[0].sprites.back_default} attacking={props.attacking} isDead={props.pokemon[0].health === 0}/>
        <PokemonStats stats={props.pokemon[0]} />
      </div>
    </div>
  )
}

export default GameView;
