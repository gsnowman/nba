function map_put(key, val) {
    var elementIndex = this.find(key);

    if (elementIndex == (-1)) {
        this.keyArray.push(key);
        this.valArray.push(val);
    } else {
        this.valArray[elementIndex] = val;
    }
}

function map_get(key) {
    var result = null;
    var elementIndex = this.find(key);

    if (elementIndex != (-1)) {
        result = this.valArray[elementIndex];
    }

    return result;
}

function map_find(key) {
    var result = -1; 
    for (var i = 0; i < this.keyArray.length; i++) {
        if (this.keyArray[i] == key) {
            result = i;
            break;
        }
    }
    return result;
}

