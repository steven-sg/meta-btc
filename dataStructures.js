class OrderedDict {
  /**
   * A javascript object/dict with ordered keys and array values (by default)
   * @param {strings[]} keys
   */
  constructor(keys = []) {
    this.keys = keys;
    this.vals = {};
    this.keys.forEach((key) => {
      this.vals[key] = [];
    });
  }

  /**
   * Makes a best effort copy
   * @param {OrderedDict} oldDict
   * @returns {OrderedDict}
   */
  static copy(oldDict) {
    const keys = oldDict.getKeys();
    const dict = new OrderedDict(keys);

    keys.forEach((key) => {
      let value;
      if (Array.isArray(oldDict.getValue(key))) {
        value = oldDict.getValue(key).map((val) => {
          if (val instanceof OrderedDict) {
            return OrderedDict.copy(val);
          }
          return JSON.parse(JSON.stringify(val));
        });
      } else {
        value = JSON.parse(JSON.stringify(oldDict.getValue(key)));
      }
      dict.setValue(key, value);
    });

    return dict;
  }

  /**
   * Push an item to the array corresponding to the key
   * @param {string} key
   * @param {*} item
   */
  pushTo(key, item) {
    if (!this.keys.includes(key)) {
      this.keys.push(key);
    }
    this.vals[key].push(item);
  }

  /**
   *
   * @param {string} key
   * @returns {*[]}
   */
  getValue(key) {
    return this.vals[key];
  }

  /**
   *
   * @param {string} key
   * @param {*[]} value
   */
  setValue(key, value) {
    this.vals[key] = value;
  }

  /**
   * Returns an ordered array of values
   * @returns {*[]}
   */
  getValues() {
    const valueList = [];
    this.keys.forEach((key) => {
      valueList.push(this.vals[key]);
    });
    return valueList;
  }

  /**
   * Returns an ordered array of objects containing key and value
   * Recursively decodes OrderedDicts
   * @returns {Objects[]}
   */
  getArray() {
    const valueList = [];
    this.keys.forEach((key) => {
      const values = this.vals[key] && this.vals[key].map((value) => {
        return value instanceof OrderedDict ? value.getArray() : value;
      });

      valueList.push({
        key,
        value: values,
      });
    });
    return valueList;
  }

  /**
   *
   * @returns {string[]}
   */
  getKeys() {
    return this.keys;
  }

  /**
   *
   * @returns {number}
   */
  getLength() {
    return this.keys.length;
  }

  /**
   *
   * @param {string} oldKey
   * @param {string} newKey
   * @param {*[]} newValue
   */
  replace(oldKey, newKey, newValue) {
    for (let i = 0; i < this.getLength; i += 1) {
      if (this.key[i] === oldKey) {
        this.key[i] = newKey;
        break;
      }
    }
    delete this.vals[oldKey];
    this.vals[newKey] = newValue;
  }

  /**
   *
   * @param {string} key
   */
  remove(key) {
    for (let i = 0; i < this.getLength; i += 1) {
      if (this.key[i] === key) {
        this.key.splice(i, 1);
        break;
      }
    }
    delete this.vals[key];
  }

  /**
   * Concatenate all the values into a single string
   * @param {string} delimiter
   */
  join(delimiter = ',') {
    return this.getValues().join(delimiter);
  }
}

module.exports = {
  OrderedDict,
};
