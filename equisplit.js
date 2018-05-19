'use strict';

var EquiSplit = function () {
  LocalContractStorage.defineProperties(this, {
        owner: null,
        balance: null,
        partner_count: null,
        idcount: null
  });
  LocalContractStorage.defineMapProperty(this, "partnersmap");
};


EquiSplit.prototype = {
  init: function () {
    this.owner = Blockchain.transaction.from;
    this.balance = new BigNumber(0);
    this.partner_count = new BigNumber(0);
    this.idcount = new BigNumber(1);
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

  getId() {
    return this.idcount;
  },

  getNextPartnershipId: function() {
    var partnerid =  "PSID"+this.idcount;
    return partnerid;
  },

  registeredCount: function() {
    return new BigNumber(this.partner_count);
  },

  createPartnership: function (name, partners) {
    this._validate(Blockchain.transaction.value);
    var name = name.toLowerCase();
    if (this.partnersmap.get(name) !== null) {
      throw new Error(name + " is already taken");
    }

    var from = Blockchain.transaction.from;
    var value = Blockchain.transaction.value;
    var amount = new BigNumber(value);
    this.partnersmap.put(name, partners);
    this.balance = amount.plus(this.balance);
    this.partner_count = new BigNumber(1).plus(this.partner_count);
    this.idcount = new BigNumber(1).plus(this.idcount);
  },

  getPartners: function (name) {
    var name = name.toLowerCase();
    return this.partnersmap.get(name);

  },

  payBills: function(name) {
    var from = Blockchain.transaction.from;
    var value = Blockchain.transaction.value;
    var amount = new BigNumber(value);
    var lowername = name.toLowerCase();
    var partners_count = this.partnersmap.get(lowername).length;


    if (this.partnersmap.get(lowername) === null) {
      throw new Error("Partner id not found");
    }
    var amountToSend = amount.dividedToIntegerBy(partners_count);
    this.partnersmap.get(lowername).forEach(function (addr) {
      var trimmed = addr.trim()
      var result = Blockchain.transfer(trimmed, amountToSend);
        if (!result) {
          throw new Error("transfer failed for " + trimmed + " with amount " + amountToSend);
        }
    });

  },

  takeOut: function () {
    var result = Blockchain.transfer(this.owner, this.balance);
    if (!result) {
      throw new Error("transfer failed.");
    }
    this.balance = new BigNumber(0);
  },

  balanceOf: function () {
    this._validate(Blockchain.transaction.value);
    return this._toNas(this.balance)+" NAS";
  },

  ownerOf: function () {
    this._validate(Blockchain.transaction.value);
    return this.owner;
  },

  verifyAddress: function (address) {
    // 1-valid, 0-invalid
    var result = Blockchain.verifyAddress(address);
    return {
      valid: result == 0 ? false : true
    };
  }
};
module.exports = EquiSplit;
