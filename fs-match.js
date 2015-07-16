if(document.location.protocol !== 'https:'){
  document.location = document.location.href.replace('http','https');
}

var fsClient = new FamilySearch({
  client_id: 'a0T3000000Bhy5yEAB',
  environment: 'production',
  save_access_token: true,
  redirect_uri: document.location.href,
  http_function: $.ajax,
  deferred_function: $.Deferred
});

var fsValidSession = false;

var watchlist;

$(function(){

  wikitree.API_DOMAIN = 'https://www.wikitree.com';
  wikitree.API_KEY = 'York1423-1';
  wikitree.API_CODE = 'CaePaith4B';

  wikitree.checkLogin({}).then(function() { 
    if (wikitree.session.loggedIn) { 
      wtLoggedIn();
    }
    hideLoader();
  });

  $('#fsSignIn').click(fsSignIn);
    
  if(fsClient.hasAccessToken()){
    fsGetUser().fail(enableFsSignIn);
  } else {
    enableFsSignIn();
  }
  
  $('#wtSignInBtn').click(function(){
    showLoader();
    wikitree.login({
      email: $('#wtEmail').val(),
      password: $('#wtPassword').val()
    }).done(wtLoggedIn);
  });
    
});

/**
 * Enable the FS Sign In button
 */
function enableFsSignIn(){
  hideLoader();
  $('#fsSignIn')
    .removeClass('disabled')
    .prop('disabled', false)
    .html('Sign In');
};

/**
 * Check whether we are signed in with both
 * wikitree and familysearch
 */
function isReady(){
  return fsValidSession && wikitree.session.loggedIn;
};

/**
 * Update page with WikiTree login succeeds
 */
function wtLoggedIn(){
  $('#wtAuth').hide();
  $('#wtUserName').text(wikitree.session.user_name);
  $('#wtSignedIn').show();
  hideLoader();
  wtWatchlistReady();
};

function fsSignIn(){
  showLoader();
  fsClient.getAccessToken().done(function(){
    fsGetUser();
  });
};

/**
 * Get the user's profile and enable the watchlist
 */
function fsGetUser(){
  return fsClient.getCurrentUser().done(function(response){
    fsValidSession = true;
    hideLoader();
    $('#fsUserName').text(response.getUser().contactName);
    $('#fsSignedIn').show();
    $('#fsAuth').hide();
    wtWatchlistReady();
  });
};

/**
 * Show watchlist ready div when we're ready
 */
function wtWatchlistReady(){
  if(isReady()){
    $('#wtWatchlistNoauth').hide();
    watchlist = new Watchlist('#wtWatchlistWrapper');
  }
};

function fsMatchParams(wtPerson){
  return {
    givenName: wtPerson.getFirstName(),
    surname: wtPerson.getLastNameCurrent(),
    gender: wtPerson.getGender(),
    birthDate: wtPerson.getBirthDate(),
    birthPlace: wtPerson.getBirthLocation(),
    deathDate: wtPerson.getDeathDate(),
    deathPlace: wtPerson.getDeathLocation()
  };
};

function getFSPersonLastModified(fsId){
  var deferred = $.Deferred(),
      promise = fsClient.http('HEAD', '/platform/tree/persons/' + fsId);
  promise.done(function(){
    try {
      deferred.resolve(new Date(promise.getResponseHeader('Last-Modified')).getTime());
    } catch(e) {
      deferred.reject(e);
    }
  });
  return deferred.promise();
};

function showLoader(){
  $('#loader').show();
};

function hideLoader(){
  $('#loader').hide();
};

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

/**
 * Manage the DOM for an entry in the Watchlist.
 */
var WatchlistEntry = function(wtPerson){
  this.wtPerson = wtPerson;
  this.connections = [];
  this.fsMatches = [];
  this.render();
  this.getWTMatches();
};

WatchlistEntry.template = Handlebars.compile($('#watchlist-entry').html());

WatchlistEntry.prototype.render = function(){
  var self = this,
      person = self.wtPerson;
  self.$dom = $(WatchlistEntry.template({
    name: person.getDisplayName(),
    url: wikitree.API_DOMAIN + '/wiki/' + person.getName(),
    birthDate: person.getBirthDateDisplay(),
    birthPlace: person.getBirthLocation(),
    deathDate: person.getDeathDateDisplay(),
    deathPlace: person.getDeathLocation()
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
      $existingResults.append(new ExistingMatch(this.connections[i]).getDOM());
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
  this.fsConnectionsPromise.done(function(){
    fsClient
      .getPersonMatchesQuery(fsMatchParams(self.wtPerson))
      .done(function(matchesResponse){
        self.fsMatches = matchesResponse.getSearchResults();
        self.renderFSMatches();
      })
      .always(function(){
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
    var resultId = fsResult.$getPrimaryPerson().id;
    // Ignore existing connections
    if(!existingFsIds[resultId]){
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

/**
 * Manage the DOM for an existing WT->FS match
 */
var ExistingMatch = function(connection){
  this.connection = connection;
  this.render();
  this.getFSPerson();
};

ExistingMatch.template = Handlebars.compile($('#existing-match-template').html());

ExistingMatch.prototype.render = function(){
  var self = this;
  self.$dom = $(ExistingMatch.template({
    id: self.connection.mFSId,
    certainty: self.connection.mCertainty
  }));
  self.$dom.find('.remove-match').click(function(event){
    event.preventDefault();
    self.$dom.find('.loader').show();
    wikitree.removePersonFSConnection(self.connection.mUserId, self.connection.mFSId).done(function(){
      self.$dom.remove();
      watchlist.getEntry(self.connection.mUserId).removeWTMatch(self.connection.mFSId);
    });
  });
};

ExistingMatch.prototype.getFSPerson = function(){
  var self = this;
  fsClient.getPerson(this.connection.mFSId).done(function(response){
    var fsPerson = response.getPerson();
    self.$dom.find('.fs-link').text(fsPerson.$getDisplayName());
    self.$dom.find('.loader').hide();
  });
};

ExistingMatch.prototype.getDOM = function(){
  return this.$dom;
};