if(document.location.protocol !== 'https:'){
  document.location = document.location.href.replace('http','https');
}

var fsClient = new FamilySearch({
  client_id: 'a0T3000000Bhy5yEAB',
  environment: 'production',
  save_access_token: true,
  redirect_uri: document.location.href
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
    fsGetUser().catch(enableFsSignIn);
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
}

/**
 * Check whether we are signed in with both
 * wikitree and familysearch
 */
function isReady(){
  return fsValidSession && wikitree.session.loggedIn;
}

/**
 * Update page with WikiTree login succeeds
 */
function wtLoggedIn(){
  $('#wtAuth').hide();
  $('#wtUserName').text(wikitree.session.user_name);
  $('#wtSignedIn').show();
  hideLoader();
  wtWatchlistReady();
}

function fsSignIn(){
  showLoader();
  fsClient.getAccessToken().then(function(){
    fsGetUser();
  });
}

/**
 * Get the user's profile and enable the watchlist
 */
function fsGetUser(){
  return fsClient.getCurrentUser().then(function(response){
    fsValidSession = true;
    hideLoader();
    $('#fsUserName').text(response.getUser().getContactName());
    $('#fsSignedIn').show();
    $('#fsAuth').hide();
    wtWatchlistReady();
  });
}

/**
 * Show watchlist ready div when we're ready
 */
function wtWatchlistReady(){
  if(isReady()){
    $('#wtWatchlistNoauth').hide();
    watchlist = new Watchlist('#wtWatchlistWrapper');
  }
}

function fsMatchParams(wtPerson){
  var father = wtPerson.getFather(),
      mother = wtPerson.getMother(),
      spouse = wtPerson.getSpouse(),
      params = {
        givenName: wtPerson.getFirstName(),
        surname: wtPerson.getLastNameAtBirth(),
        gender: wtPerson.getGender(),
        birthDate: wtPerson.getBirthDate(),
        birthPlace: wtPerson.getBirthLocation(),
        deathDate: wtPerson.getDeathDate(),
        deathPlace: wtPerson.getDeathLocation()
      };

  if(wtPerson.getMiddleName()){
    params.givenName += ' ' + wtPerson.getMiddleName();
  }

  addFSMatchParams(params, father, 'father');
  addFSMatchParams(params, mother, 'mother');
  addFSMatchParams(params, spouse, 'spouse');

  return params;
}

function addFSMatchParams(params, wtPerson, relation){
  if(wtPerson){
    params[relation + 'GivenName'] = wtPerson.getFirstName();
    params[relation + 'Surname'] = wtPerson.getLastNameCurrent();
  }
}

function getFSPersonLastModified(fsId){
  var deferred = $.Deferred(),
      promise = fsClient.http('HEAD', '/platform/tree/persons/' + fsId + '?_breaker=' + Math.random());
  promise.then(function(response){
    var date = new Date(response.getHeader('Last-Modified'));
    if(!isNaN(date.getTime())) {
      deferred.resolve(date);
    } else {
      deferred.reject();
    }
  });
  return deferred.promise();
}

function showLoader(){
  $('#loader').show();
}

function hideLoader(){
  $('#loader').hide();
}

/**
 * Generate and submit a form with the source data that will be attached.
 * The form is removed from the DOM after it's submitted.
 * @param {Object} data {pid, title, notes, citation}
 */
function fsAttachSubmitForm(data){
  var form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://familysearch.org/links-pages/sourceCA?cid=a0T3000000Bhy5yEAB&mode=import&personId=' + data.pid;
  form.target = '_blank';

  var input;
  for(var name in data){
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = data[name];
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDateString(){
  var date = new Date();
  return date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
}
