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
  this.total = 0;
  this.order = 'user_last_name_current';

  this.render();
  this.load();
};

Watchlist.template = Handlebars.compile($('#watchlist').html());

Watchlist.prototype.render = function(){
  var self = this;
  self.$dom = $(Watchlist.template()).appendTo(self.$container);
  self.$list = self.$dom.find('.watchlist');
  self.$total = self.$dom.find('.total-pages');
  self.$page = self.$dom.find('.page-input');
  self.$prev = self.$dom.find('.prev').click(function(){
    self.prev();
  });
  self.$next = self.$dom.find('.next').click(function(){
    self.next();
  });
  self.$go = self.$dom.find('.go').click(function(){
    self.go(self.$page.val());
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

Watchlist.prototype.go = function(page){
  page = parseInt(page, 10) || 1;
  this.offset = (page - 1) * 25;
  this.load();
};

Watchlist.prototype.load = function(){
  var self = this;
  self.$container.hide();
  self.$list.html('');
  showLoader();
  this.entries = {};

  wikitree.getWatchlist({
    getSpace: 0,
    limit: self.limit,
    order: self.order,
    offset: self.offset
  }).then(function(response){

    self.total = response.total;
    self.updatePager();

    // Gather person IDs to make batch request to getRelatives endpoint
    var ids = [];
    for(var i = 0; i < response.list.length; i++){
      ids.push(response.list[i].getId());
    }

    wikitree.getRelatives(ids, true, true).then(function(persons){
      for(var i = 0; i < ids.length; i++){
        self.addWTPerson(persons[ids[i]]);
      }
      self.$container.show();
      hideLoader();
    });

  });
};

Watchlist.prototype.updatePager = function(){
  this.$total.text(Math.ceil(this.total / this.limit));

  // Calculate current page
  this.$page.val(Math.ceil((this.offset + 1) / this.limit));

  if(this.offset === 0){
    this.$prev.attr('disabled', 'disabled');
  } else {
    this.$prev.attr('disabled', false);
  }

  if(this.offset + this.limit >= this.total){
    this.$next.attr('disabled', 'disabled');
  } else {
    this.$next.attr('disabled', false);
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
