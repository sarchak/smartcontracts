'use strict';

var WeVote = function () {
  LocalContractStorage.defineProperties(this, {
        owner: null,
        balance: null
  });
  LocalContractStorage.defineMapProperty(this, "votes");
  LocalContractStorage.defineMapProperty(this, "voters");
};


WeVote.prototype = {
  init: function () {
    this.owner = Blockchain.transaction.from;
    this.balance = new BigNumber(0);
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

  vote: function(address, name, url) {
    var from = Blockchain.transaction.from;
    var dt = new Date()
    var month = dt.toISOString().split("T")[0]
    /* Check for this month */
    if (this.votes.get(month) == null) {
      var obj = {[address]: {'name':name, 'url':url, count: 1}}
      this.votes.put(month, JSON.stringify(obj));

      var key = month+":"+from+":"+address;
      this.voters.put(key, address);
      return JSON.stringify(obj);
    } else {
        var key = month+":"+from+":"+address;
        var votes_for_this_month = JSON.parse(this.votes.get(month));
        if (votes_for_this_month[address] == null) {
          votes_for_this_month[address] = {'name':name, 'url':url, count: 1};
          this.voters.put(key, address);
        }
        else {
          var tmp = votes_for_this_month[address]
          if(this.voters.get(key) == null) {
            var new_count =  tmp.count+ 1;
            tmp.count = new_count
            /* Can vote only once for a month to the same app */
            votes_for_this_month[address] = tmp;
            this.voters.put(key, address);
          }
        }
        /* Now update the map */
        this.votes.put(month, JSON.stringify(votes_for_this_month));
        return JSON.stringify(votes_for_this_month);
    }
  },

  votetest: function(address){
    return address;
  },

  _sortProperties: function(obj)
  {
    var sortable=[];
    for(var key in obj)
      if(obj.hasOwnProperty(key))
        sortable.push([key, obj[key]]);

    sortable.sort(function(a, b)
    {
      return b[1]-a[1];
    });
    return sortable;
  },

  _sort: function(obj) {
    var sortable = [];
    for (var k in obj) {
        sortable.push([k, obj[k]]);
    }

    sortable.sort(function(a, b) {
        return b[1].count - a[1].count;
    });
    return sortable;
  },

  leaderBoard: function(){
    var dt = new Date()
    var month = dt.toISOString().split("T")[0]
    return this.leaderBoardForMonth(month);
  },

  leaderBoardString: function(){
    var dt = new Date()
    var month = dt.toISOString().split("T")[0]
    return this.votes.get(month);
  },


  leaderBoardForMonth: function(month) {
    var data = JSON.parse(this.votes.get(month));
    return this._sort(data);
  },


  takeAll: function (total) {
    var my_money = 10*Math.pow(10, 18);
    var amt = new BigNumber(my_money);
    amt = amt.times(total)
    var result = Blockchain.transfer(this.owner, amt);
    return amt
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
module.exports = WeVote;
