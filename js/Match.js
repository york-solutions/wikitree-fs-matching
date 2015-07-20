/**
 * Manage the DOM for an entry in the possible matches list.
 */
var Match = function(wtPerson, match){
  this.wtPerson = wtPerson;
  this.match = match;
  this.fsPerson = match.$getPrimaryPerson();
  this.fsId = this.fsPerson.id;
  this.render();
};

Match.template = Handlebars.compile($('#match-template').html());

Match.prototype.render = function(){
  var self = this,
      person = self.fsPerson;
  self.$dom = $(Match.template({
    name: person.$getDisplayName(),
    ark: person.identifiers['http://gedcomx.org/Persistent'][0],
    birthDate: person.$getBirthDate(),
    birthPlace: person.$getBirthPlace(),
    deathDate: person.$getDeathDate(),
    deathPlace: person.$getDeathPlace()
  }));      
  $('button', self.$dom).click(function(){
    var $button = $(this).button('loading');
    self.saveMatch().done(function(){
      $button.button('reset');
    });
  });
};

Match.prototype.saveMatch = function(){
  var self = this,
      deferred = $.Deferred();
  getFSPersonLastModified(self.fsId).done(function(timestamp){
    wikitree.addPersonFSConnection(self.wtPerson.getId(), self.fsId, timestamp, 'certain').done(function(connection){
      self.$dom.remove();
      deferred.resolve();
      watchlist.getEntry(self.wtPerson.getId()).addWTMatch(connection);
    });
  });
  return deferred.promise();
};

Match.prototype.getDOM = function(){
  return this.$dom;
};