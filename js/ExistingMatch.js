/**
 * Manage the DOM for an existing WT->FS match
 */
var ExistingMatch = function(connection, wtPerson){
  this.connection = connection;
  this.wtPerson = wtPerson;
  this.render();
  this.getFSPerson();
  this.getSources();
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
  self.$dom.find('.fs-attach').click(function(event){
    event.preventDefault();
    var url = wtProfileUrl(self.wtPerson);
    fsAttachSubmitForm({
      pid: self.connection.mFSId,
      title: self.wtPerson.getLongNamePrivate() + ' on WikiTree',
      url: url,
      citation: 'WikiTree contributors, "' + self.wtPerson.getLongNamePrivate() + '", WikiTree, ' + url + ' (accessed ' + getDateString() + ')'
    });
  });
};

ExistingMatch.prototype.getFSPerson = function(){
  var self = this;
  fsClient.getPersonWithRelationships(this.connection.mFSId, {persons: true}).then(function(response){
    var fsPerson = response.getPrimaryPerson(),
        fathers = response.getFathers(),
        mothers = response.getMothers(),
        spouses = response.getSpouses();
    self.$dom.find('.fs-link').text(fsPerson.getDisplayName());
    self.$dom.find('.birth-date').text(fsPerson.getDisplayBirthDate());
    self.$dom.find('.birth-place').text(fsPerson.getDisplayBirthPlace());
    self.$dom.find('.death-date').text(fsPerson.getDisplayDeathDate());
    self.$dom.find('.death-place').text(fsPerson.getDisplayDeathPlace());
    if(fathers && fathers.length){
      self.$dom.find('.father-name').text(fathers[0].getDisplayName());
    }
    if(mothers && mothers.length){
      self.$dom.find('.mother-name').text(mothers[0].getDisplayName());
    }
    if(spouses && spouses.length){
      self.$dom.find('.spouse-name').text(spouses[0].getDisplayName());
    }
    self.$dom.find('.loader').hide();
  });
};

/**
 * Check to see whether a wikitree sources has already been attached
 */
ExistingMatch.prototype.getSources = function(){
  var self = this;
  fsClient.getSourcesQuery('/platform/tree/persons/' + this.connection.mFSId + '/sources').then(function(response){
    var linked = false,
        url = wtProfileUrl(self.wtPerson);
    response.getSourceDescriptions().forEach(function(source){
      if(source.getAbout() === url){
        linked = true;
      }
    });
    if(!linked){
      self.$dom.find('.fs-attach').show();
    }
  });
};

ExistingMatch.prototype.getDOM = function(){
  return this.$dom;
};
