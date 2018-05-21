'use strict';

var IBuiltItFirst = function () {
  LocalContractStorage.defineProperties(this, {
        owner: null,
        balance: null,
        dapp_count: null
  });
  LocalContractStorage.defineMapProperty(this, "submissions");
  LocalContractStorage.defineMapProperty(this, "user_submission_count");
};


IBuiltItFirst.prototype = {
  init: function () {
    this.owner = Blockchain.transaction.from;
    this.balance = new BigNumber(0);
    this.dapp_count = new BigNumber(0);
  },

  _toNas: function (value) {
    var data = new BigNumber(value);
    var one_nas = new BigNumber(10*Math.pow(10, 18));
    return data.dividedBy(one_nas);
  },

  _toWei: function(value) {
    var data = new BigNumber(value);
    var one_nas = new BigNumber(10*Math.pow(10, 18));
    return one_nas.times(data);
  },

  _validate: function(value) {
    var data = new BigNumber(value);
    if (data != 0) {
      throw new Error("Looks like you are sending NAS for methods which don't require them.\
        Well, you are in good hands we are giving it back.")
    }
  },

  submitDapp: function (contract_addr, name, url, content) {
    this._validate(Blockchain.transaction.value);

    var from = Blockchain.transaction.from;
    var value = Blockchain.transaction.value;
    var amount = new BigNumber(value);

    var data = this.submissions.get(from);
    if (data == null) {
      data = [];
    }
    const obj = {
        contract_addr: contract_addr,
        name: name,
        url: url,
        content: content
    };
    data.unshift(obj);
    this.submissions.put(from, data);
    this.dapp_count = new BigNumber(1).plus(this.dapp_count);
    Event.Trigger("IBuiltItFirst", {
      Transfer: {
        from: Blockchain.transaction.from,
        event_type: "Submitted New DApp",
        dapp_name: name,
        contract_addr: contract_addr
      }
    });
  },

  getMySubmissions: function() {
    return this.submissions.get(Blockchain.transaction.from);
  },

  balanceOf: function () {
    this._validate(Blockchain.transaction.value);
    return this._toNas(this.balance)+" NAS";
  },

  takeAll: function (total) {
    var my_money = 1*Math.pow(10, 18);
    var amt = new BigNumber(my_money);
    amt = amt.times(total)
    var result = Blockchain.transfer(this.owner, amt);
    return amt
  },


  verifyAddress: function (address) {
    // 1-valid, 0-invalid
    var result = Blockchain.verifyAddress(address);
    return {
      valid: result == 0 ? false : true
    };
  }
};
module.exports = IBuiltItFirst;
