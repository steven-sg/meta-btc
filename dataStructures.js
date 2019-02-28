class OrderedDict {
  constructor(keys = []) {
    this.keys = keys;
    this.vals = {};
    this.keys.forEach((key) => {
      this.vals[key] = [];
    });
  }

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

  pushTo(key, item) {
    if (!this.keys.includes(key)) {
      this.keys.push(key);
    }
    this.vals[key].push(item);
  }

  getValue(key) {
    return this.vals[key];
  }

  setValue(key, value) {
    this.vals[key] = value;
  }

  getValues() {
    const valueList = [];
    this.keys.forEach((key) => {
      valueList.push(this.vals[key]);
    });
    return valueList;
  }

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

  getKeys() {
    return this.keys;
  }

  getLength() {
    return this.keys.length;
  }

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

  remove(key) {
    for (let i = 0; i < this.getLength; i += 1) {
      if (this.key[i] === key) {
        this.key.splice(i, 1);
        break;
      }
    }
    delete this.vals[key];
  }

  join(delimiter = ',') {
    return this.getValues().join(delimiter);
  }
}

module.exports = {
  OrderedDict,
};
