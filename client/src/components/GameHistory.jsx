import React, { Component } from 'react';
import GameHistoryRow from './GameHistoryRow.jsx';
import css from '../styles.css';
import hist from '../gameHistory.css';

const GameHistory = (props) => {
  return (
    <div className={hist.container}>
      <div className={hist.gamesList}>
        {props.gameHistoryData.map(game => {
          return (
            <GameHistoryRow name={props.name} game={game} key={game.id} />
          );
        })}
      </div>
      <button className={hist.gameButton} onClick={function() { props.toggleGameHistory() }}>Close</button>
    </div>
  );
}

export default GameHistory;