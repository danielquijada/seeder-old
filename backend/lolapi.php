    <?php
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
        header('Content-type: application/json');
    }

    $request = explode('/', trim($_SERVER['PATH_INFO'],'/'));
    // Here goes your Riot API Key: (This one is just a placeholder, it won't work)
    define("API_KEY",'RGAPI-12345abc-ab1a-123a-1abc-12a1ab12a1a1');
    $body = $_GET["body"];

    if (count($request)) {
        $type = $request[0];

        switch ($type) {
            case 'rank':
                getRank($request[1]);
                break;
        }
    }

    function getRank($id) {
        $url = 'https://euw1.api.riotgames.com/lol/league/v3/positions/by-summoner/' . $id . '?api_key=' . API_KEY;
        get($url);
    }

    function get ($url) {
        $context = stream_context_create(array(
            'http' => array('ignore_errors' => true),
        ));

        $result = file_get_contents($url, false, $context);

        echo $result;
    }
  ?>