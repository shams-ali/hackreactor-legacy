import React, { Component } from 'react';
import Pokemon from './Pokemon.jsx';
import PokemonStats from './PokemonStats.jsx';
import css from '../styles.css';

const GameOverView = (props) => {
  return (
    <div>
      <div className={css.gameOver}>
        <h1>{props.winner} wins!</h1>

        <div className={css.winnerPokeView}>
          {props.pokemon.map(poke => {
            return (
              <div key={poke.name}>
                <Pokemon key={poke.name} sprite={poke.sprites.front_default} gameOver={props.gameOver}/>
                <h5>{poke.name}</h5>
                <h5>{poke.health} / {poke.initialHealth}</h5>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GameOverView;
