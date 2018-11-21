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
      dict.setValue(key, oldDict.getValue(key));
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
