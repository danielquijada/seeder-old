var app = angular.module('seeder', []);
app.controller('controller', function($http, $scope, $q) {

  self = this;

  self.newTeam = false;

  var api_index = 0;

  var DEFAULT_PLAYER_VALUE = 500; // Equivalente a S5 0LP
  var DIVISION_VALUE = 100;
  var TIER_VALUE = 500;

  var notFound =  [];
  var data = retrieveData();
  var keys = retrieveKeys();
  var example = "{\r\n\t\"marta\": [\r\n\t\t\"40297772\",\r\n\t\t\"22751690\"\r\n\t],\r\n\t\"dani\": [\r\n\t\t\"22242394\",\r\n\t\t\"33568110\"\r\n\t],\r\n\t\"fernix\": [\r\n\t\t\"22307718\"\r\n\t]\r\n}";

  this.teams = data ? data : example;
  self.keys = keys ? keys : [];
  self.seeKeys = self.keys.length === 0 ? true : false;

  self.formatInput = function() {
      var teams = JSON.parse(self.teams);
      self.teams=formatJson(teams); // Easy-to-Read
      persistData();
  }

  self.calculate = function() {
      notFound.splice(0,notFound.length);
      self.result='Buscando';
      var teams = JSON.parse(self.teams);
      self.teams=formatJson(teams); // Easy-to-Read

      var summonersIdsArray = getSummonerIdsAsArray(teams);
      getSummonersInfo(summonersIdsArray).then (function (info) {
          for (var id in info) {
              info[id].value = calculatePlayerValue(info[id]);
          }

          for (var team in teams) {
              var t = teams[team];
              t.value = calculateTeamValue (t, info);
          }

          var orderedTeams = orderTeams(teams);
          self.result = formatOrderedTeams(orderedTeams);
      });
    //   getSummonerIds(summonersArray).then(function(response) {
    //       var summonersInfo = (response);
    //       getSummonersInfo(summonersInfo, teams);
    //   });
      persistData();
  }

    // input = document.getElementById('csvIn');
    // var file = document.getElementById("csvIn").files[0];
    // if (file) {
    //   var reader = new FileReader();
    //   reader.readAsText(file, "UTF-8");
    //   reader.onload = function (evt) {
    //       console.log("onload", evt.target.result);
    //   }
    //   reader.onerror = function (evt) {
    //       console.log("error reading file");
    //   }
    // }

  document.getElementById('csvIn').addEventListener('change', parseFile, false);

  function processCSV(csv) {
      var promptText = 'Introduzca la expresión regular para reconocer cada línea. En el primer grupo debe estar el equipo y en el segundo el id del invocador.';
      var defaultRegex = '(.*);.*?(\\d+)'
      var regex = new RegExp (prompt (promptText,defaultRegex), 'g');
    //   var regex = /(.*);.*;.*;.*;.*?(\d+);.*;.*;.*;.*/g;
      var matches = [];

      var match = regex.exec(csv);
      while (match != null) {
          matches.push([match[1], match[2]]);
          match = regex.exec(csv);
      }

      return arrayToObject(matches);
  }

  function arrayToObject(array) {
      var object = {};

      for (var i = 0; i < array.length; i++) {
          if (!object[array[i][0]]) {
              object[array[i][0]] = [];
          }
          object[array[i][0]].push(array[i][1]);
      }

      return object;
  }

  function parseFile (evt) {
      var file = evt.target.files[0];

      if (file) {
          var reader = new FileReader();
          reader.readAsText(file, "windows-1252");
          reader.onload = function(e) {
            var teams = processCSV(e.target.result);
            self.teams = formatJson(teams);
            $scope.$apply();
          }
      }
  }

  self.addTeam = function() {
      if (self.newTeam) {
          return;
      }
      self.newTeam = true;
      self.new = {
          "name": "",
          "members": []
      }
      persistData();
  }

  self.saveTeamsJson = function () {
      download("teams.json", self.teams);

      var teams = JSON.parse(self.teams);
      self.teams=formatJson(teams); // Easy-to-Read

      var summonersArray = getSummonerIdsAsArray(teams);
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
      self.new.members.push("");
  }

  self.saveNewTeam = function() {
      self.newTeam = false;
      var teams;
      if (self.teams.trim().length != 0) {
          teams = JSON.parse(self.teams);
      } else {
          teams = {};
      }
      var nw = self.new;
      teams[nw.name] = nw.members.map(function(link) {
          return link.match(/\/\d{8}/)[0].substr(1);
      });
      self.teams=formatJson(teams); // Easy-to-Read
      persistData();
  }

  self.cancelNewTeam = function() {
      self.newTeam = false;
  }

  self.saveKeys = function() {
      self.keys = self.keys.filter(function(v){return v!==''});
      persistKeys();
      self.seeKeys = false;
  }

  self.addKey = function() {
      self.keys.push("");
  }

  self.showKeys = function() {
      self.seeKeys = true;
  }

  function allSummonerInfoGathered(info) {
      var all = true;
      for (sum in info) {
          all = all && info[sum].value;
          if (!all) {
              break;
          }
      }
      return all;
  }

  function calculateTeamValue (team, info) {
      var points = 0;

      for (var i = 0; i < team.length; i++) {
          var id = team[i];
          points += info[id] ? info[id].value : DEFAULT_PLAYER_VALUE;
          if (!info[id]) {
              notFound.push(id);
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
      var array = [];

      for (var teamName in teams) {
          var name = [];
          name["name"] = teamName;
          teams[teamName]["name"] = teamName;
          array.push(teams[teamName]);
      }

      orderedTeams = array.sort (function (a, b) {
         return -(a.value - b.value);
      });
    //   while (Object.keys(teamsCopy).length > 0) {
    //       var maxVal = -1;
    //       var maxKey;
      //
    //       for (key in teamsCopy) {
    //           var val = teamsCopy[key].value;
    //           if (val > maxVal) {
    //               maxKey = key;
    //               maxVal = val;
    //           }
    //       }
      //
    //       delete teamsCopy[maxKey];
    //       orderedTeams.push(maxKey);
    //   }

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
      window.localStorage.setItem("teams", self.teams);
  }

  function persistKeys() {
      window.localStorage.setItem("keys", JSON.stringify(self.keys));
  }

  function calculatePlayerValue(playerData) {
      var value = DEFAULT_PLAYER_VALUE;

      if (playerData && playerData.lp !== "undefined") {
          value = 0;
          value += playerData.lp;
          value += divisionToValue(playerData.division);
          value += tierToValue(playerData.tier);
      }

      return value;
  }

  function getApiKey() {
      return self.keys[api_index++ % self.keys.length];
  }

  function getSummonersInfo(summoners) {
      return getSummonersInformation(summoners);
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

  function getSummonersInformation(ids) {
      return $q(function (resolve, reject) {
          var information = {};

          var pagedIds = pageIds (ids, 10);

          var info = {};
          var promises = [];
          for (var i in pagedIds) {
              var index = pagedIds[i];
              var promise = fetchLeagues(index);
              promises.push(promise);
          }
          $q.all(promises).then(function(responses) {
              var parsePromises = [];
              for (var i in responses) {
                  var response = responses[i];
                  parseData(info, response.data);
              }
              resolve (info);
          });
      });
  }

  function formatOrderedTeams(teams) {
      var output = "";
      for (var i = 0; i < teams.length; i++) {
          //   output += (i + 1) + ". " + teams[i] + " (" + valueToDivision(teamsObject[teams[i]].value) + ")" + "\n";
        output += (i + 1) + ". " + teams[i].name + " (" + valueToDivision(teams[i].value) + ")" + "\n";
      }
      return output;
  }

  function parseData(info, data) {
      for (var id in data) {
          var summData = data[id];
          console.log(id);
          var soloqData = summData.find(function(entry){
              return entry.queue === "RANKED_SOLO_5x5";
          });
          if (soloqData) {
              var sum = {
                  tier: soloqData.tier,
                  division: soloqData.entries[0].division,
                  lp: soloqData.entries[0].leaguePoints,
                  isFreshBlood: soloqData.entries[0].isFreshBlood,
                  isHotStreak: soloqData.entries[0].isHotStreak,
                  isInactive: soloqData.entries[0].isInactive,
                  isVeteran: soloqData.entries[0].isVeteran,
                  wins: soloqData.entries[0].wins,
                  losses: soloqData.entries[0].losses,
              }
              info[id] = sum;
          }
      }
  }

  function fetchLeagues(ids) {
    var str = ids.toString();
    var requestLeague = 'https://euw.api.pvp.net/api/lol/euw/v2.5/league/by-summoner/' + str + '/entry?api_key=' + getApiKey();
    self.result += ".";
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
  }

  function getSummonerIdsAsArray (teams) {
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
