import React from 'react';
import css from '../styles.css';

const Logo = (props) => {
  const renderTurn = () => {
    if (props.opponent) {
      if (props.isActive) {
        return 'Your turn'
      } else {
        return `${props.opponent.name}'s turn`; 
      }
    } else {
      return null;
    }
  }
  let seriesRecord = null;
  if (props.numWins > 0 || props.numOpponentWins > 0) {
    seriesRecord = <p className={css.record}>You {props.numWins > props.numOpponentWins ? 'lead' : 'trail'} {props.numWins} - {props.numOpponentWins}</p>;
  }
  return (
    <div className={css.logoContainer}>
      <h2 className={css.chattermonLogo}><span><img src={'https://art.ngfiles.com/images/386000/386577_stardoge_8-bit-pokeball.png?f1446737358'} style={{maxWidth: '50px'}} /></span>Chattermon</h2>
      <h4 className={css.opponents}>{props.name} v. {props.opponent ? props.opponent.name : '???' }</h4>
      {seriesRecord}
      <h4>{renderTurn()}</h4>
      <button className={css.gameButton} onClick={function() { props.toggleGameHistory() }}>Win/Loss Record</button>
    </div>
  )
}

export default Logo; 