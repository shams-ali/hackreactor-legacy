import React, { Component } from 'react';
import GameHistoryRow from './GameHistoryRow.jsx';
import css from '../styles.css';
import hist from '../gameHistory.css';
import gameHistoryData from '../../../test/exampleGameHistoryData.js';

const GameHistory = (props) => {
  return (
    <div className={hist.container}>
      <h1 className={hist.header}>Win/Loss Record</h1>
      <div className={hist.gamesList}>
        {gameHistoryData.games.map(game => {
          return (
            <GameHistoryRow game={game} key={game.id} />
          );
        })}
      </div>
      <button className={css.gameButton}>Close</button>
    </div>
  );
}

export default GameHistory;