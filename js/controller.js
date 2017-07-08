var app = angular.module('seeder', []);
app.controller('controller', function ($http, $scope, $q) {

    self = this;

    self.newTeam = false;

    var api_index = 0;

    var DEFAULT_PLAYER_VALUE = 500; // Equivalente a S5 0LP
    var DIVISION_VALUE = 100;
    var TIER_VALUE = 500;

    var notFound = [];

    var example = "{\r\n\t\"marta\": [\r\n\t\t\"40297772\",\r\n\t\t\"22751690\"\r\n\t],\r\n\t\"dani\": [\r\n\t\t\"22242394\",\r\n\t\t\"33568110\"\r\n\t],\r\n\t\"fernix\": [\r\n\t\t\"22307718\"\r\n\t]\r\n}";
    this.teams = retrieveData() || example;

    self.formatInput = function () {
        var teams = JSON.parse(self.teams);
        self.teams = formatJson(teams); // Easy-to-Read
        persistData();
    }

    self.calculate = function () {
        notFound.splice(0, notFound.length);
        self.result = 'Buscando';
        var teams = JSON.parse(self.teams);
        self.teams = formatJson(teams); // Easy-to-Read

        var summonersIdsArray = getSummonerIdsAsArray(teams);
        getSummonersInfo(summonersIdsArray).then(function (info) {
            for (var id in info) {
                info[id].value = calculatePlayerValue(info[id]);
            }

            for (var team in teams) {
                var t = teams[team];
                t.value = calculateTeamValue(t, info);
            }

            var orderedTeams = orderTeams(teams);
            self.result = formatOrderedTeams(orderedTeams);
        });
        persistData();
    }

    document.getElementById('csvIn').addEventListener('change', parseFile, false);

    function processCSV(csv) {
        var regex = getRegex();
        var matches = [];
        var team;
        while (match = regex.exec(csv)) {
            team = match[1] || team || error('El primer jugador debe tener señalado el equipo.');
            matches.push([team, match[2]]);
        }

        return arrayToObject(matches);
    }

    function getRegex() {
        var promptText = 'Introduzca la expresión regular para reconocer cada línea. En el primer grupo debe estar el equipo (si se omite, se agregará al equipo anterior) y en el segundo el id del invocador.';
        var defaultRegex = window.localStorage.getItem("regex") || '(.*);.*?(\\d+)';
        var regex = prompt(promptText, defaultRegex);
        window.localStorage.setItem("regex", regex);
        return new RegExp(regex);
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

    function parseFile(evt) {
        var file = evt.target.files[0];

        if (file) {
            var reader = new FileReader();
            reader.readAsText(file, "windows-1252");
            reader.onload = function (e) {
                var teams = processCSV(e.target.result);
                self.teams = formatJson(teams);
                $scope.$apply();
            }
        }
    }

    self.addTeam = function () {
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
        self.teams = formatJson(teams); // Easy-to-Read

        var summonersArray = getSummonerIdsAsArray(teams);
        getSummonerIds(summonersArray).then(function (response) {

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

    self.addPlayer = function () {
        self.new.members.push("");
    }

    self.saveNewTeam = function () {
        self.newTeam = false;
        var teams;
        if (self.teams.trim().length != 0) {
            teams = JSON.parse(self.teams);
        } else {
            teams = {};
        }
        var nw = self.new;
        teams[nw.name] = nw.members.map(function (link) {
            return link.match(/\/\d{8}/)[0].substr(1);
        });
        self.teams = formatJson(teams); // Easy-to-Read
        persistData();
    }

    self.cancelNewTeam = function () {
        self.newTeam = false;
    }

    self.saveKeys = function () {
        self.keys = self.keys.filter(function (v) { return v !== '' });
        persistKeys();
        self.seeKeys = false;
    }

    self.addKey = function () {
        self.keys.push("");
    }

    self.showKeys = function () {
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

    function calculateTeamValue(team, info) {
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

        orderedTeams = array.sort(function (a, b) {
            return -(a.value - b.value);
        });

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

    function getSummonersInfo(summoners) {
        console.log('Summoners:', summoners);
        var info = {};
        return getSummonersInformation(info, summoners);
    }

    function valueToDivision(value) {
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

    function getSummonersInformation(info, ids, currentIdIndex) {
        currentIdIndex = currentIdIndex || 0;

        console.log('Info at [' + currentIdIndex + ']', JSON.parse(JSON.stringify(info)));
        return $q((resolve, reject) => {
            if (ids.length > currentIdIndex) {
                fetchLeague(ids[currentIdIndex]).then(
                    function success(response) {
                        if (response.data.status) {
                            var timeout = 10000;
                            console.log('Waiting...' + (timeout / 1000) + 's');
                            setTimeout(
                                function () {
                                    getSummonersInformation(info, ids, currentIdIndex).then(fullInfo => resolve(fullInfo));
                                },
                                timeout
                            );
                        } else {
                            getSummonersInformation(info, ids, currentIdIndex + 1).then(fullInfo => resolve(fullInfo));
                            parseData(info, response.data);
                        }
                    },
                    function error(error) {
                        var timeout = 1000;
                        console.log('Waiting...' + (timeout / 1000) + 's');
                        setTimeout(
                            function () {
                                getSummonersInformation(info, ids, currentIdIndex).then(fullInfo => resolve(fullInfo));
                            },
                            timeout
                        );
                    }
                )
            } else {
                resolve(info);
            }
        });
    }


    function formatOrderedTeams(teams) {
        var output = "";
        for (var i = 0; i < teams.length; i++) {
            output += (i + 1) + ". " + teams[i].name + " (" + valueToDivision(teams[i].value) + ")" + "\n";
        }
        return output;
    }

    function parseData(info, data) {
        var soloqData = data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        if (soloqData) {
            var SummId = soloqData.playerOrTeamId;
            info[SummId] = {
                tier: soloqData.tier,
                division: soloqData.rank,
                lp: soloqData.leaguePoints,
                isFreshBlood: soloqData.freshBlood,
                isHotStreak: soloqData.hotStreak,
                isInactive: soloqData.inactive,
                isVeteran: soloqData.veteran,
                wins: soloqData.wins,
                losses: soloqData.losses,
            }
        }
    }

    function fetchLeague(id) {
        console.log('Fetching for SummID', id);
        var str = id.toString();
        var requestLeagueUrl = 'http://swiollvfer.esy.es/lolapi.php/rank/' + str;
        self.result += ".";
        console.log('\tURL:', requestLeagueUrl);
        return $http({
            method: 'GET',
            url: requestLeagueUrl
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

    function getSummonerIdsAsArray(teams) {
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

    function error(error) {
        const errorMsg = 'Ha ocurrido un error' + (error ? ': ' + error : '');
        console.error(errorMsg);
        alert(errorMsg);
    }
});

function formatJson(jsonString) {
    var txt = JSON.stringify(jsonString, null, '\t'); // Indented with tab
    return txt;
}

app.filter('formatJson', function () {
    return function (x) {
        if (typeof x === "string") {
            return x
        } else {
            return formatJson(x);
        }
    };
});
