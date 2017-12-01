import React, { Component } from 'react';
import Pokemon from './Pokemon.jsx';
import PokemonCard from './PokemonCard.jsx';
import css from '../styles.css';
import hist from '../gameHistory.css';

const GameHistoryRow = (props) => {
  return (
    <div className={hist.row}>
      <div className={hist.winLoss}>WIN!</div>

      <div className={hist.player}>
        <h3 className={hist.playerName}>{props.game.winner_name}</h3>
        <div className={hist.team}>
          {props.game.winner_pokemon.map(poke => {
            return (
              <div className={hist.pokemonCard} key={poke.name} >
                <PokemonCard sprites={poke.sprites} name={poke.name} health={poke.health} initialHealth={poke.initialHealth} />
              </div>
            );      
          })}
        </div>
      </div>

      <div className={hist.player}>
        <h3 className={hist.playerName}>{props.game.loser_name}</h3>
        <div className={hist.team}>
          {props.game.loser_pokemon.map(poke => {
            return (
              <div className={hist.pokemonCard} key={poke.name}>
                <PokemonCard sprites={poke.sprites} name={poke.name} health={poke.health} initialHealth={poke.initialHealth} />
              </div>
            );      
          })}
        </div>
      </div>

    </div>  
  );
}

export default GameHistoryRow;