var app = angular.module("seeder", []);
app.controller("controller", function($scope) {
  $scope.summoner = {
    "name":"kísa"
  };

  var calculate = function () {
    $scope.result="Buscando...";

    var name = $scope.summoner.name;
    var requestSumm = "https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/by-name/" + name + "?api_key=872376d4-d057-4cb3-b9aa-6af145caeb89";

    console.log("CHECKPOINT 1");
    $http({
      method: 'GET',
      url: requestSumm
    }).then(function(summData) {
        console.log("CHECKPOINT 2");
          var id = summData[name].id;

          var requestLeague = "https://euw.api.pvp.net/api/lol/euw/v2.5/league/by-summoner/" + id + "/entry?api_key=872376d4-d057-4cb3-b9aa-6af145caeb89";

          $.http({
              method:'GET',
              url: requestLeague
            }).then(function(result) {
              console.log("CHECKPOINT 3");
              var leagueData = result[id][0];
              summData = leagueData.entries[0];
              $scope.result = {
                "tier": leagueData.tier,
                "division": summData.division,
                "LP": summData.leaguePoints,
                "W-L": summData.wins + " - " + summData.losses
              };
              console.log("CHECKPOINT 4");
          });

      });

    // $.get(requestSumm, function(summData) {
    //   var id = summData[name].id;
    //
    //   var requestLeague = "https://euw.api.pvp.net/api/lol/euw/v2.5/league/by-summoner/" + id + "/entry?api_key=872376d4-d057-4cb3-b9aa-6af145caeb89";
    //   $.get(requestLeague, function(result) {
    //     leagueData = result[id][0];
    //     summData = leagueData.entries[0];
    //     $scope.result = {
    //       "tier": leagueData.tier,
    //       "division": summData.division,
    //       "LP": summData.leaguePoints,
    //       "W-L": summData.wins + " - " + summData.losses
    //     };
    //   });
    // });
    // var xhr = new XMLHttpRequest();
    // xhr.open("GET", , false);
    // xhr.send();
    //
    // var id = JSON.parse(xhr.response)[$scope.summoner.name].id;
    // var xhr2 = new XMLHttpRequest();
    // var request = "https://euw.api.pvp.net/api/lol/euw/v2.5/league/by-summoner/" + id + "/entry?api_key=872376d4-d057-4cb3-b9aa-6af145caeb89";
    // xhr2.open("GET", request, false);
    // xhr2.send();
    //
    // xhr2.response.then(function(response) {
    //   console.log("RESPONSE: " + response);
    // });
    // var jsonResponse = JSON.parse(xhr2.response)[id];
//
    // $scope.result = {
    //   "tier": jsonResponse.tier,
    //   "division": jsonResponse.division,
    //   "LP": jsonResponse.leaguePoints,
    //   "W-l": jsonResponse.wins + "-" + jsonResponse.loses
    // };
  };

  $scope.calculate = calculate;
});
