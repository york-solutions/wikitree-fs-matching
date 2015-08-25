/**
 * Manage the DOM for the watchlist.
 * Load watchlist from wikitree API.
 * Control pagination.
 */
var Watchlist = function(selector){
  this.$container = $(selector);
  
  this.entries = {};
  this.offset = 0;
  this.limit = 25;
  this.order = 'user_last_name_current';
  
  this.render();
  this.load();
};

Watchlist.template = Handlebars.compile($('#watchlist').html());

Watchlist.prototype.render = function(){
  var self = this;
  self.$dom = $(Watchlist.template()).appendTo(self.$container);
  self.$list = self.$dom.find('.watchlist');
  self.$prev = self.$dom.find('.prev').click(function(){
    self.prev();
  });
  self.$next = self.$dom.find('.next').click(function(){
    self.next();
  });
};

Watchlist.prototype.next = function(){
  this.offset += this.limit;
  this.load();
};

Watchlist.prototype.prev = function(){
  this.offset = Math.max(0, this.offset - this.limit);
  this.load();
};

Watchlist.prototype.load = function(){
  var self = this;
  self.$container.hide();
  self.$list.html('');
  showLoader();
  // TODO: clear entries list
  wikitree.getWatchlist({
    getSpace: 0,
    excludeLiving: 1,
    limit: self.limit,
    order: self.order,
    offset: self.offset
  }).then(function(persons){      
    
    // Gather person IDs to make batch request to getRelatives endpoint
    var ids = [];
    for(var i = 0; i < persons.length; i++){
      ids.push(persons[i].getId());
    }
    
    wikitree.getRelatives(ids, true, true).then(function(persons){
      for(var i in persons){
        self.addWTPerson(persons[i]);
      }
      self.prevState();
      self.$container.show();
      hideLoader();
    });
    
  });
};

Watchlist.prototype.prevState = function(){
  if(this.offset === 0){
    this.$prev.attr('disabled','disabled');
  } else {
    this.$prev.attr('disabled',false);
  }
};

Watchlist.prototype.addWTPerson = function(person){
  var entry = new WatchlistEntry(person);
  this.entries[person.getId()] = entry;
  this.$list.append(entry.getDOM());
};

Watchlist.prototype.getEntry = function(id){
  return this.entries[id];
};