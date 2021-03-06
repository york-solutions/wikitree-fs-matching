/**
 * Manage the DOM for an entry in the Watchlist.
 */
var WatchlistEntry = function(wtPerson){
  this.fsConfidenceThreshold = 3;
  this.wtPerson = wtPerson;
  this.connections = [];
  this.fsMatches = [];
  this.render();
  this.getWTMatches();
  this.getPossibleFSMatches();
};

WatchlistEntry.template = Handlebars.compile($('#watchlist-entry').html());

WatchlistEntry.prototype.render = function(){
  var self = this,
      person = self.wtPerson,
      father = person.getFather(),
      mother = person.getMother(),
      spouse = person.getSpouse();
  self.$dom = $(WatchlistEntry.template({
    name: person.getLongNamePrivate(),
    id: person.getName(),
    url: wikitree.API_DOMAIN + '/wiki/' + person.getName(),
    editUrl: wikitree.API_DOMAIN + '/index.php?title=' + person.getName() + '&action=edit',
    birthDate: person.getBirthDateDisplay(),
    birthPlace: person.getBirthLocation(),
    deathDate: person.getDeathDateDisplay(),
    deathPlace: person.getDeathLocation(),
    fatherName: father ? father.getLongNamePrivate() : '',
    motherName: mother ? mother.getLongNamePrivate() : '',
    spouseName: spouse ? spouse.getLongNamePrivate() : ''
  }));
  self.$searchButton = $('.fs-matches-btn', self.$dom).click(function(){
    self.getPossibleFSMatches();
  });
  self.$possibleResults = self.$dom.find('.possible-match-results');
};

WatchlistEntry.prototype.getWTMatches = function(){
  var self = this;
  this.fsConnectionsPromise = wikitree.getPersonFSConnections(self.wtPerson.getId()).done(function(connections){
    self.connections = connections;
    self.renderWTMatches();
  });
};

WatchlistEntry.prototype.renderWTMatches = function(){
  var self = this;
  self.$dom.find('.existing-matches').find('.loader').hide();
  var $existingResults = self.$dom.find('.existing-match-results').html('');
  var $noMatchesMessage = self.$dom.find('.no-existing-matches-message').hide();
  if(this.connections.length === 0){
    $noMatchesMessage.show();
  } else {
    for(var i = 0; i < this.connections.length; i++){
      $existingResults.append(new ExistingMatch(this.connections[i], this.wtPerson).getDOM());
    }
  }
};

WatchlistEntry.prototype.addWTMatch = function(connection){
  this.connections.push(connection);
  this.renderWTMatches();
  this.renderFSMatches();
};

WatchlistEntry.prototype.removeWTMatch = function(fsId){
  for(var i = 0; i < this.connections.length; i++){
    if(this.connections[i].mFSId === fsId){
      this.connections.splice(i, 1);
    }
  }
  this.renderWTMatches();
  this.renderFSMatches();
};

WatchlistEntry.prototype.getPossibleFSMatches = function(){
  var self = this;
  self.$searchButton.button('loading');
  this.fsConnectionsPromise.then(function(){
    fsClient.getPersonMatchesQuery(fsMatchParams(self.wtPerson))
      .then(function(matchesResponse){
        self.fsMatches = matchesResponse.getSearchResults();
        self.renderFSMatches();
      }).then(function(){
        self.$searchButton.remove();
      }, function(e){
        console.error(e.stack);
        self.$searchButton.remove();
      });
  });
};

WatchlistEntry.prototype.renderFSMatches = function(){
  var self = this;
  var $resultsTable = $('<table class="table table-striped">');
  var $possibleResults = self.$dom.find('.possible-match-results').html('');
  var $noMatchesMessage = self.$dom.find('.no-fs-matches-message').hide();
  var existingFsIds = {};
  var count = 0;
  for(var i = 0; i < this.connections.length; i++){
    existingFsIds[this.connections[i].mFSId] = true;
  }
  $.each(this.fsMatches, function(i, fsResult){
    var resultId = fsResult.getPrimaryPerson().getId();

    // Ignore existing connections
    // Filter out low confidence matches
    if(!existingFsIds[resultId] && fsResult.data.confidence >= self.fsConfidenceThreshold){
      $resultsTable.append(new Match(self.wtPerson, fsResult).getDOM());
      count++;
    }
  });
  if(count){
    $possibleResults.html($resultsTable);
  } else {
    $noMatchesMessage.show();
  }
};

WatchlistEntry.prototype.getDOM = function(){
  return this.$dom;
};
