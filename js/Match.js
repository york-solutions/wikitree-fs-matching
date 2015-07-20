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

Match.template = Handlebars.compile($('#potential-match-template').html());

Match.prototype.render = function(){
  var self = this,
      person = self.fsPerson,
      data = {
        name: person.$getDisplayName(),
        id: person.id,
        ark: person.identifiers['http://gedcomx.org/Persistent'][0],
        birthDate: person.$getBirthDate(),
        birthPlace: person.$getBirthPlace(),
        deathDate: person.$getDeathDate(),
        deathPlace: person.$getDeathPlace()
      };
      
  if(this.match.$getFathers().length){
    var father = this.match.$getFathers()[0];
    data.fatherName = father.$getDisplayName();
  }
  if(this.match.$getMothers().length){
    var mother = this.match.$getMothers()[0];
    data.motherName = mother.$getDisplayName();
  }
  if(this.match.$getSpouses().length){
    var spouse = this.match.$getSpouses()[0];
    data.spouseName = spouse.$getDisplayName();
  }
  
  self.$dom = $(Match.template(data));      
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
  getFSPersonLastModified(self.fsId).done(function(date){
    var timestamp = date.toISOString().slice(0, 19).replace('T', ' ');
    var certainty = self.$dom.find('.certainty').val();
    wikitree.addPersonFSConnection(self.wtPerson.getId(), self.fsId, timestamp, certainty).done(function(connection){
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