/**
 * Manage the DOM for an existing WT->FS match
 */
var ExistingMatch = function(connection, wtPerson){
  this.connection = connection;
  this.wtPerson = wtPerson;
  this.fsPersonResponse = null;
  this.render();
  this.getFSPerson();
  this.getSources();
};

ExistingMatch.template = Handlebars.compile($('#existing-match-template').html());

ExistingMatch.prototype.render = function(){
  var self = this;

  // Render the DOM
  self.$dom = $(ExistingMatch.template({
    id: self.connection.mFSId,
    certainty: self.connection.mCertainty
  }));

  // Setup event listener for removing a match
  self.$dom.find('.remove-match').click(function(event){
    event.preventDefault();
    self.$dom.find('.loader').show();
    wikitree.removePersonFSConnection(self.connection.mUserId, self.connection.mFSId).done(function(){
      self.$dom.remove();
      watchlist.getEntry(self.connection.mUserId).removeWTMatch(self.connection.mFSId);
    });
  });

  // Setup even listener for attaching a source to FS
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

  // Setup an event listener for saving FS data to WikiTree
  self.$dom.find('.wikitree-merge').click(function(event){
    event.preventDefault();

    // We need to modify the data slightly so we first make a copy of it
    var gedcomx = JSON.parse(JSON.stringify(self.fsPersonResponse.getData()));

    // Mark the principal person and attach the document's source to them
    gedcomx.persons.forEach(function(person){
      if(person.id === self.connection.mFSId){
        person.principal = true;
        if(!Array.isArray(person.sources)){
          person.sources = [];
        }
        person.sources.push({
          description: gedcomx.description
        });
      }
    });

    // Add the agent so that WikiTree knows which site it's coming from and can display the site name
    if(!Array.isArray(gedcomx.agents)){
      gedcomx.agents = [];
    }
    gedcomx.agents.push({
      id: 'agent',
      names: [{
        lang: 'en',
        value: 'FamilySearch Family Tree'
      }],
      homepage: {
        resource: 'https://familysearch.org/tree'
      }
    });

    // Link the source description to the agent
    if(Array.isArray(gedcomx.sourceDescriptions)){
      for(var i = 0; i < gedcomx.sourceDescriptions.length; i++){
        if(gedcomx.sourceDescriptions[i].id === gedcomx.description.substring(1)){
          gedcomx.sourceDescriptions[i].repository = {
            resource: '#agent'
          };
        }
      }
    }

    // Set the import summary
    gedcomx.summary = 'Imported data from FamilySearch Family Tree ' + self.connection.mFSId + '.';

    wikiTreeMergeEditForm(self.wtPerson.getId(), gedcomx);
  });
};

ExistingMatch.prototype.getFSPerson = function(){
  var self = this;
  fsClient.getPerson(this.connection.mFSId, {relatives: true}).then(function(response){
    self.fsPersonResponse = response;
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
