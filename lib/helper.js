/**
 * @param {string} text String
 * @param {regex} r Regex to match against
 * @returns {Array} Array of matches, or empty array if there were no matches
 */
exports.createArrayOfMatches = (o, text) => {
  const option = {
    time: /([0-1]\d|2[0-3]):[0-5]\d|\basap\b/g,
    user: /([A-Z]|\d){9}/g
  };
  return (regex => {
    if (!text.match(regex)) {
      return [];
    }

    return text.match(regex);
  })(option[o]);
};

/**
 * Searches for the provided string in array
 * @param {Array} arr Array
 * @param {string} str String
 * @returns {number} The index of the string otherwise -1
 */
exports.findStringInArray = (arr, str) => {
  return arr.findIndex(ele => ele === str);
};

exports.makeId = () => {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (var i = 0; i < 9; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};
