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
  fsClient.getPerson(this.connection.mFSId).then(function(response){
    var fsPerson = response.getPerson();
    self.$dom.find('.fs-link').text(fsPerson.getDisplayName());
    self.$dom.find('.birth-date').text(fsPerson.getDisplayBirthDate());
    self.$dom.find('.birth-place').text(fsPerson.getDisplayBirthPlace());
    self.$dom.find('.death-date').text(fsPerson.getDisplayDeathDate());
    self.$dom.find('.death-place').text(fsPerson.getDisplayDeathPlace());
    self.$dom.find('.loader').hide();
  });
};

ExistingMatch.prototype.getDOM = function(){
  return this.$dom;
};