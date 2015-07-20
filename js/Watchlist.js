/**
 * Manage the DOM for the watchlist.
 * Load watchlist from wikitree API.
 * Control pagination.
 */
var Watchlist = function(selector){
  this.$container = $(selector);
  this.entries = {};
  this.offset = 0;
  this.limit = 5;
  this.order = 'user_last_name_current';
  this.render();
  this.load();
};

Watchlist.prototype.render = function(){
  var self = this;
  self.$list = $('<div>')
    .appendTo(self.$container)
    .addClass('list-group');
  var $buttons = $('<div>')
    .addClass('wt-pagination')
    .appendTo(self.$container);
  self.$prev = $('<button>')
    .addClass('btn btn-primary prev')
    .text('< Prev')
    .appendTo($buttons)
    .click(function(){
      self.prev();
    });
  self.$next = $('<button>')
    .addClass('btn btn-primary next')
    .text('Next >')
    .appendTo($buttons)
    .click(function(){
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
  }).done(function(persons){      
    $.each(persons, function(i, person){
      if(!person.isLiving()){
        watchlist.addWTPerson(person);
      }
    });
    self.prevState();
    self.$container.show();
    hideLoader();
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