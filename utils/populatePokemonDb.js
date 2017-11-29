require('dotenv').config();

const axios = require('axios');
const Pokemon = require('../database/db').Pokemon;

const populatePokemonDb = (maxIndex = 151, maxReq = 5, timeout = 15000) => {
  const set = new Set();

  const addReq = (i) => {
    if (!set.has(i) && set.size >= maxReq) {
      console.log('retry', i, set);
      return setTimeout(addReq, timeout, i);
    }

    set.add(i);
    axios.get(`https://pokeapi.co/api/v2/pokemon/${i}/`).then((result) => {
      const pokemonObj = {
        types: []
      };

      result.data.types.forEach((typeObj) => {
        pokemonObj.types[typeObj.slot - 1] = typeObj.type.name;
      });
      
      pokemonObj.name = result.data.name;
      pokemonObj.id = result.data.id;
      pokemonObj.baseHealth = result.data.stats[5].base_stat;
      pokemonObj.baseAttack = result.data.stats[4].base_stat;
      pokemonObj.baseDefense = result.data.stats[3].base_stat;
      pokemonObj.backSprite = result.data.sprites.back_default;
      pokemonObj.frontSprite = result.data.sprites.front_default;

      Pokemon.findOrCreate({
        where: {
          name: pokemonObj.name
        },
        defaults: pokemonObj
      }).then(() => {
        set.delete(i);
      }).catch((err) => {
        console.log('bad save', err);
        set.delete(i);
      });
    }).catch((err) => {
      console.log('bad req', err);
      setTimeout(addReq, timeout, i);
    });
  };

  for (let i = 1; i <= maxIndex; ++i) {
    addReq(i);
  }
};

populatePokemonDb();

