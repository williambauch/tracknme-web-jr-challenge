$(window).on('load', function () {
    var waypts = [];
    var records;
    var map;
    var directionsDisplay;
    var directionsService = new google.maps.DirectionsService();

    var getDbLocal = () => {
        //faz uma requisição no servidor apiary
        $.get("http://private-acd50-apitracknme.apiary-mock.com/locations", function (data) {
            
            //armazena o resultado no localStorage
            localStorage.setItem('dbLocal', JSON.stringify(data));

            mapLoad();
        });
    };
    getDbLocal();

    function menu(records) {

        //pega todos os registros ordenados por dateTime
        records = jlinq.from(records).sort("dateTime").select();

        // cria o MENU com as datas de pesquisa disponíveis
        var str1, str2 = "";
        $(".menu").empty();

        for (var i = 0; i < records.length; i++) {

            str1 = records[i].dateTime.slice(0, 10);
            if (str1 !== str2) {
                str2 = records[i].dateTime.slice(0, 10);

                var date = new Date(records[i].dateTime);
                date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                $(".menu").append("<li class='page-scroll'><a href='#' id='" + records[i].dateTime.slice(0, 10) + "'>" + date + "</a></li>");
            }
        }

    }

    function searchRecords(date) {

        //Recupera os dados salvos no localStorage
        records = JSON.parse(localStorage.getItem('dbLocal'));

        //monta MENU
        menu(records);

        if (date) {
            //pega todos os registros ordenados por dateTime fazendo o filtro pela data selecionada
            records = jlinq.from(records).sort("dateTime")
                .starts("dateTime", date.slice(0, 10))
                .select();
        } else {
            //ordena todo os registros por data
            records = jlinq.from(records).sort("dateTime").select();
        }

        return records;
    }


    function mapLoad(date) {

        records = searchRecords(date);

        //orderna as dateTime em ordem crescente e seleciona o último registro
        var lastRecord = jlinq.from(records).sort("dateTime").last();

        //filtra todos os records mais recentes
        var recordsData = jlinq.from(records)
            .sort("dateTime")
            .starts("dateTime", lastRecord.dateTime.slice(0, 10))
            .select();
        
        //pega o registro do ponto de partida
        var originRecord = jlinq.from(records)
            .sort("dateTime")
            .starts("dateTime", lastRecord.dateTime.slice(0, 10))
            .first();

        //pega o registro do ponto de chega
        var destinyRecord = jlinq.from(records)
            .sort("dateTime")
            .starts("dateTime", lastRecord.dateTime.slice(0, 10))
            .last();

        //monta o array com pontos de parada
        waypts = [];
        for (var i = 0; i < recordsData.length; i++) {
            if (recordsData.length > 2) {
                if ((recordsData[i].dateTime != originRecord.dateTime)
                    && (recordsData[i].dateTime != destinyRecord.dateTime)) {
                    var loc = recordsData[i].latitude + ',' + recordsData[i].longitude
                    waypts.push({
                        location: loc,
                        stopover: true
                    });
                }
            }
        }

        directionsDisplay = new google.maps.DirectionsRenderer();

        var request = {
            origin: {
                lat: originRecord.latitude,
                lng: originRecord.longitude
            },
            destination: {
                lat: destinyRecord.latitude,
                lng: destinyRecord.longitude
            },
            waypoints: waypts,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.DRIVING
        };

        var directionsService = new google.maps.DirectionsService();

        //faz a requisição da rota do Google Maps
        directionsService.route(request, function (result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result);
            }
        });

        var options = {
            zoom: 5,
            center: {
                lat: destinyRecord.latitude,
                lng: destinyRecord.longitude
            },
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        map = new google.maps.Map(document.getElementById("mapa"), options);
        //carrega o Maps do Google
        directionsDisplay.setMap(map);
        
        $("#trajeto-texto").empty();

        //carrega a rota de texto do Google
        directionsDisplay.setPanel(document.getElementById("trajeto-texto"));
    }

    $(".menu").on("click", function (event) {
        mapLoad(event.target.id);
    })

});