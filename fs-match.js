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
      promise = fsClient.http('HEAD', '/platform/tree/persons/' + fsId + '?_breaker=' + Math.random());
  promise.done(function(){
    var date = new Date(promise.getResponseHeader('Last-Modified'));
    if(!isNaN(date.getTime())) {
      deferred.resolve(date);
    } else {
      deferred.reject();
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