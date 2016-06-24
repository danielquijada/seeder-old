var app = angular.module('seeder', []);
app.controller('controller', function($scope, $http) {

  self = this;
  $scope.summoner = {
    'name':'kísa'
  };

  var API_KEY = '872376d4-d057-4cb3-b9aa-6af145caeb89';

  var example = '{\r\n\t\"team1\": [\r\n\t\t\"Swiollvfer\",\r\n\t\t\"k\u00EDsa\",\r\n\t\t\"allow0w\",\r\n\t\t\"caradrio\",\r\n\t\t\"ERGHUN\"\r\n\t],\r\n\t\"team2\": [\r\n\t\t\"cpw fernix\",\r\n\t\t\"anikila2r\",\r\n\t\t\"cPw Flameador9\",\r\n\t\t\"pijusmagnificous\",\r\n\t\t\"cpw xabrii\",\r\n\t\t\"AitorStrak\"\r\n\t]\r\n}';
  // console.log(JSON.stringify(JSON.parse(example), null, '\t'));
  $scope.teams = example;

  self.formatInput = function() {
      var teams = JSON.parse($scope.teams.toLowerCase());
      $scope.teams=formatJson(teams); // Easy-to-Read
  }

  self.calculate = function() {
      $scope.result='Buscando';
      var teams = JSON.parse($scope.teams.toLowerCase());
      $scope.teams=formatJson(teams); // Easy-to-Read

      var summonersArray = getSummoners(teams);
      getSummonerIds(summonersArray).then(function(response) {
          var summonersInfo = getSummonerIdsSuccess(response);
          getSummonersInfo(summonersInfo);
      }, getSummonerIdsError);
  }

  function getSummonersInfo(summoners) {
      var information = {};

      var ids = Object.keys(summoners).map(function(summoner) {
          return summoners[summoner].id;
      });

      var ids = pageIds (ids, 10);
      var toExec = [];

      for (var i in ids) {
          toExec.push(i);
      }

      for (var i in toExec) {
          $scope.result += ".";
          var j = i;
          var index = toExec[i];
          console.log(ids[index]);
          fetchLeagues(ids[index]).then(function(response) {
              toExec.splice(j, 1);
              for (id in response) {
                  information[id] = response[id];
              }
              console.log(toExec.length + ":" + j);
              if (toExec.length <= 0) {
                  parseData (summoners, information);
              }
          });
      }

    //   while (toExec.length > 0) {
    //         $scope.result += ".";
    //         var delay=3000;
    //         setTimeout(function() {
    //             for (var i in toExec) {
    //                 $scope.result += ".";
    //                 var j = i;
    //                 var index = toExec[i];
    //                 fetchLeagues(summoners, ids[index]).then(function(response) {
    //                     toExec.splice(j, 1);
    //                     summoners = parseData(summoners, response);
    //                 });
    //             }
    //         }, delay);
    //   }
  }

  function parseData(summoners, response) {
      debugger;
  }

  function fetchLeagues(ids) {
    var str = ids.toString();
    console.log("STR:");
    console.log(ids);
    var requestLeague = 'https://euw.api.pvp.net/api/lol/euw/v2.5/league/by-summoner/' + str + '/entry?api_key=' + API_KEY;
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
      var requestSumm = 'https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/by-name/' + array.toString() + '?api_key=' + API_KEY;
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

  // var calculate = function () {
  //   $scope.result='Buscando';
  //   self.searching = true;
  //
  //   var name = $scope.summoner.name;
  //   var requestSumm = 'https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/by-name/' + name + '?api_key=' + API_KEY;
  //
  //   $http({
  //     method: 'GET',
  //     url: requestSumm
  //   }).then(function(summData) {
  //         if (self.searching) {
  //           $scope.result += '.';
  //         }
  //         var id = summData.data[name].id;
  //
  //         var requestLeague = 'https://euw.api.pvp.net/api/lol/euw/v2.5/league/by-summoner/' + id + '/entry?api_key=' + API_KEY;
  //
  //         $http({
  //             method:'GET',
  //             url: requestLeague
  //           }).then(function(result) {
  //             if (self.searching) {
  //               $scope.result += '.';
  //             }
  //             var leagueData = result.data[id][0];
  //             summData = leagueData.entries[0];
  //             $scope.result = {
  //               'tier': leagueData.tier,
  //               'division': summData.division,
  //               'LP': summData.leaguePoints,
  //               'W-L': summData.wins + ' - ' + summData.losses
  //             };
  //         }, function(error) {
  //           console.log("something happened");
  //         });
  //     }, function(error) {
  //       console.log("something happened 2");
  //     });
  // };
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
