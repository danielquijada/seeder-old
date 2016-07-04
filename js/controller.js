var app = angular.module('seeder', []);
app.controller('controller', function($scope, $http, $q) {

  self = this;

  $scope.newTeam = false;

  var api_index = 0;

  var DEFAULT_VALUE = 500; // Equivalente a S5 0LP
  var DIVISION_VALUE = 100;
  var TIER_VALUE = 500;

  var notFound =  [];
  var example = '{\r\n\t\"team1\": [\r\n\t\t\"Swiollvfer\",\r\n\t\t\"k\u00EDsa\",\r\n\t\t\"allow0w\",\r\n\t\t\"caradrio\",\r\n\t\t\"ERGHUN\"\r\n\t],\r\n\t\"team2\": [\r\n\t\t\"cpw fernix\",\r\n\t\t\"anikila2r\",\r\n\t\t\"cPw Flameador9\",\r\n\t\t\"pijusmagnificous\",\r\n\t\t\"cpw xabrii\",\r\n\t\t\"AitorStrak\"\r\n\t]\r\n}';
  // console.log(JSON.stringify(JSON.parse(example), null, '\t'));
  var data = retrieveData();
  var keys = retrieveKeys();
  $scope.teams = data ? data : example;
  $scope.keys = keys ? keys : [];
  $scope.seeKeys = $scope.keys.length === 0 ? true : false;

  self.formatInput = function() {
      var teams = JSON.parse($scope.teams.toLowerCase());
      $scope.teams=formatJson(teams); // Easy-to-Read
      persistData();
  }

  self.calculate = function() {
      notFound.splice(0,notFound.length);
      $scope.result='Buscando';
      var teams = JSON.parse($scope.teams.toLowerCase());
      $scope.teams=formatJson(teams); // Easy-to-Read

      var summonersArray = getSummoners(teams);
      getSummonerIds(summonersArray).then(function(response) {
          var summonersInfo = getSummonerIdsSuccess(response);
          getSummonersInfo(summonersInfo, teams);
      });
      persistData();
  }

  self.addTeam = function() {
      if ($scope.newTeam) {
          return;
      }
      $scope.newTeam = true;
      $scope.new = {
          "name": "",
          "members": []
      }
      persistData();
  }

  self.saveTeamsJson = function () {
      download("teams.json", $scope.teams);

      var teams = JSON.parse($scope.teams.toLowerCase());
      $scope.teams=formatJson(teams); // Easy-to-Read

      var summonersArray = getSummoners(teams);
      getSummonerIds(summonersArray).then(function(response) {
          var ids = {};

          for (key in Object.keys(response.data)) {
              key = Object.keys(response.data)[key];
              ids[key] = response.data[key].id;
          }

          download("summonerIds.json", JSON.stringify(ids));
      });
  }

  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  self.addPlayer = function() {
      console.log($scope.new);
      $scope.new.members.push("");
      console.log($scope.new);
  }

  self.saveNewTeam = function() {
      $scope.newTeam = false;
      var teams = JSON.parse($scope.teams.toLowerCase());
      var nw = $scope.new;
      teams[nw.name] = nw.members;
      $scope.teams=formatJson(teams); // Easy-to-Read
      persistData();
  }

  self.cancelNewTeam = function() {
      $scope.newTeam = false;
  }

  self.saveKeys = function() {
      $scope.keys = $scope.keys.filter(function(v){return v!==''});
      persistKeys();
      $scope.seeKeys = false;
  }

  self.addKey = function() {
      $scope.keys.push("");
  }

  self.showKeys = function() {
      $scope.seeKeys = true;
  }

  function allSummonerInfoGathered(info) {
      var all = true;
      for (sum in info) {
          all = all && info[sum].value;
          if (!all) {
              console.log("NOT ALL YET");
              break;
          }
      }
      return all;
  }

  function calculateTeamValue (team, summoners) {
      var points = 0;
      for (var i = 0; i < team.length; i++) {
          var summoner = team[i];
          summoner = summoner.replace(/\s/g, '');
          points += summoners[summoner] ? summoners[summoner].value : DEFAULT_VALUE;
          if (!summoners[summoner]) {
              notFound.push(summoner);
          }
      }
      return points / team.length;
  }

  function calculateTeamsValue(teams, summoners) {
      for (var i in teams) {
          var team = teams[i];
          t = {};
          t.team = team;
          t.value = calculateTeamValue(team, summoners);
          teams[i] = t;
      }
      if (notFound.length > 0) {
          alert("There was an error with this summoners:\n" + notFound.toString() + "\n Default Unranked value was assigned.");
      }
  }

  function orderTeams(teams) {
      var orderedTeams = [];
      var teamsCopy = JSON.parse(JSON.stringify(teams));

      while (Object.keys(teamsCopy).length > 0) {
          var maxVal = -1;
          var maxKey;

          for (key in teamsCopy) {
              var val = teamsCopy[key].value;
              if (val > maxVal) {
                  maxKey = key;
                  maxVal = val;
              }
          }

          delete teamsCopy[maxKey];
          orderedTeams.push(maxKey);
      }

      return orderedTeams;
  }

  function divisionToValue(division) {
      var number;
      switch (division) {
        case "V":
            number = 0;
            break;
        case "IV":
            number = 1;
            break;
        case "III":
            number = 2;
            break;
        case "II":
            number = 3;
            break;
        case "I":
            number = 4;
            break;
      };
      return number * DIVISION_VALUE;
  }

  function tierToValue(tier) {
      var number;
      switch (tier) {
        case "BRONZE":
            number = 0;
            break;
        case "SILVER":
            number = 1;
            break;
        case "GOLD":
            number = 2;
            break;
        case "PLATINUM":
            number = 3;
            break;
        case "DIAMOND":
            number = 4;
            break;
        case "MASTER":
            number = 5;
            break;
        case "CHALLENGER":
            number = 6;
            break;
      };
      return number * TIER_VALUE;
  }

  function retrieveData() {
      return window.localStorage.getItem("teams");
  }

  function retrieveKeys() {
      return JSON.parse(window.localStorage.getItem("keys"));
  }

  function persistData() {
      window.localStorage.setItem("teams", $scope.teams);
  }

  function persistKeys() {
      window.localStorage.setItem("keys", JSON.stringify($scope.keys));
  }

  function calculatePlayerValue(summoners, summs) {
      return new Promise(function(resolve, reject) {
          for (summName in summs) {
              if (typeof summs[summName].lp !== "undefined") {
                  var value = 0;

                    value += summs[summName].lp;
                    value += divisionToValue(summs[summName].division);
                    value += tierToValue(summs[summName].tier);

                  summoners[summName].value = value;
              } else {
                  if (!summoners[summName].value) {
                      summoners[summName].value = DEFAULT_VALUE;
                  }
              }
          }
          resolve (summoners);
      })
  }

  function getApiKey() {
      return $scope.keys[api_index++ % $scope.keys.length];
  }

  function getSummonersInfo(summoners, teams) {
      return getSummonersInformation(summoners, teams);
  }

  function valueToDivision (value) {
      var obj = valueToDivisionObject(value);
      return obj.tier + " " + obj.division + " - " + obj.lp + " LP"
  }

  function valueToDivisionObject(value) {
      var tierNum = value / TIER_VALUE;
      var semiValue = value % TIER_VALUE;

      var divisionNum = semiValue / DIVISION_VALUE;

      var lp = (semiValue % DIVISION_VALUE).toFixed(0);
      var tier = tierNumToTier(tierNum);
      var division = divisionNumToDivision(divisionNum);

      var lvl = {
          "tier": tier,
          "division": division,
          "lp": lp
      }

      return lvl;
  }

  function tierNumToTier(tierNum) {
      var tier;
      tierNum = Math.floor(tierNum);
      switch (tierNum) {
        case 0:
            tier = "BRONZE";
            break;
        case 1:
            tier = "SILVER";
            break;
        case 2:
            tier = "GOLD";
            break;
        case 3:
            tier = "PLATINUM";
            break;
        case 4:
            tier = "DIAMOND";
            break;
        case 5:
            tier = "MASTER";
            break;
        case 6:
            tier = "CHALLENGER";
            break;
      }
      return tier;
  }

  function divisionNumToDivision(divisionNum) {
      var div;
      divisionNum = Math.floor(divisionNum);
      switch (divisionNum) {
        case 0:
            div = "V";
            break;
        case 1:
            div = "IV";
            break;
        case 2:
            div = "III";
            break;
        case 3:
            div = "II";
            break;
        case 4:
            div = "I";
            break;
      }
      return div;
  }

  function getSummonersInformation(summoners, teams) {
      var information = {};

      var ids = Object.keys(summoners).map(function(summoner) {
          return summoners[summoner].id;
      });

      var ids = pageIds (ids, 10);

      var promises = [];
      for (var i in ids) {
          $scope.result += ".";
          var index = ids[i];
          var promise = fetchLeagues(index);
          promises.push(promise);
      }
      $q.all(promises).then(function(responses) {
          var parsePromises = [];
          for (i in responses) {
              var response = responses[i];
              var parsePromise = parseData(summoners, response.data);
              parsePromises.push(parsePromise);
          }
          $q.all(parsePromises).then(function(summss) {
              var cpvPromises = [];
              for (i in summss) {
                  var summs = summss[i];
                  cpvPromises.push(calculatePlayerValue(summoners, summs, teams));
              }
              $q.all(cpvPromises).then(function(responses){
                  calculateTeamsValue(teams, summoners);
                  $scope.result = formatOrderedTeams(orderTeams(teams), teams);
              });
          });
      });
  }

  function formatOrderedTeams(teams, teamsObject) {
      var output = "";
      for (var i = 0; i < teams.length; i++) {
          output += (i + 1) + ". " + teams[i] + " (" + valueToDivision(teamsObject[teams[i]].value) + ")" + "\n";
      }
      return output;
  }

  function parseData(summoners, data) {
      return new Promise(function(resolve, reject) {
          var summs = {};
          for (summ in summoners) {
              var id = summoners[summ].id;
              var soloqData;

              if (id) {
                  summs[summ] = JSON.parse(JSON.stringify(summoners[summ]));
                  if (data[id]) {
                      var summData = data[id];
                      var soloqData = summData.find(function(entry){
                          return entry.queue === "RANKED_SOLO_5x5";
                      });
                      summs[summ].tier = soloqData.tier;
                      summs[summ].division = soloqData.entries[0].division;
                      summs[summ].lp = soloqData.entries[0].leaguePoints;
                      summs[summ].isFreshBlood = soloqData.entries[0].isFreshBlood;
                      summs[summ].isHotStreak = soloqData.entries[0].isHotStreak;
                      summs[summ].isInactive = soloqData.entries[0].isInactive;
                      summs[summ].isVeteran = soloqData.entries[0].isVeteran;
                      summs[summ].wins = soloqData.entries[0].wins;
                      summs[summ].losses = soloqData.entries[0].losses;
                  }
              }
          }
          resolve (summs);
      });
  }

  function fetchLeagues(ids) {
    var str = ids.toString();
    var requestLeague = 'https://euw.api.pvp.net/api/lol/euw/v2.5/league/by-summoner/' + str + '/entry?api_key=' + getApiKey();
    return $http({
        method: 'GET',
        url: requestLeague
    });
  }

  function pageIds(ids, pageSize) {
      var array = [];

      var start = 0;
      while (start < ids.length) {
          var end = start + pageSize;
          array.push(ids.slice(start, end));
          start = end;
      }
      return array;
  }

  function getSummonerIds(array) {
      var requestSumm = 'https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/by-name/' + array.toString() + '?api_key=' + getApiKey();
      return $http({
        method: 'GET',
        url: requestSumm
      });;
  }

  function getSummonerIdsSuccess(response) {
      var summonerIds = {};

      for (summoner in response.data) {
        summonerIds[summoner] = {
          "id": response.data[summoner].id
        }
      }

      self.ids = summonerIds;
      return summonerIds;
  }

  function getSummonerIdsError(error) {
    console.log("ERROR: ");
    console.log(error);
  }

  function getSummoners (teams) {
      var summoners = [];
      for (i in teams) {
        var team = teams[i];
        for (j in team) {
          var summoner = team[j];
          summoners.push(summoner);
        }
      }
      return summoners;
  }
});

function formatJson (jsonString) {
  var txt = JSON.stringify(jsonString, null, '\t'); // Indented with tab
  return txt;
}

app.filter('formatJson', function() {
    return function(x) {
      if (typeof x === "string") {
        return x
      } else {
        return formatJson(x);
      }
    };
});
