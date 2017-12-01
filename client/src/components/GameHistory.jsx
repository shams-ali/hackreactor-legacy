import React, { Component } from 'react';
import GameHistoryRow from './GameHistoryRow.jsx';
import css from '../styles.css';
import hist from '../gameHistory.css';

const GameHistory = (props) => {
  return (
    <div className={hist.container}>
      <h1 className={hist.header}>Win/Loss Record</h1>
      <div className={hist.gamesList}>
        {props.gameHistoryData.map(game => {
          return (
            <GameHistoryRow game={game} key={game.id} />
          );
        })}
      </div>
      <button className={css.gameButton} onClick={function() { props.toggleGameHistory() }}>Close</button>
    </div>
  );
}

export default GameHistory;