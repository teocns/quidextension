var CONSTANTS = {
	login_ivaservizi_post_url: "https://ivaservizi.agenziaentrate.gov.it/portale/home?p_p_id=58&p_p_lifecycle=1&p_p_state=maximized&p_p_mode=view&_58_struts_action=%2Flogin%2Flogin",
    login_telematici_post_url:"https://telematici.agenziaentrate.gov.it/TelentWebLogin/j_security_check",
	portale:"https://ivaservizi.agenziaentrate.gov.it/portale/",
	ivaservizi_scelta_utente :"https://ivaservizi.agenziaentrate.gov.it/portale/scelta-utenza-lavoro?",
    telematici_scelta_utente:"https://telematici.agenziaentrate.gov.it/Servizi/Utente/SceltaProfilo/AssociazioneProfilo1.do",
	logout:"https://ivaservizi.agenziaentrate.gov.it/portale/c/portal/logout",
    cassettofiscale : "https://telematici.agenziaentrate.gov.it/Servizi/Messaggi.jsp",
    telematici_requestUserChange : "https://telematici.agenziaentrate.gov.it/Servizi/Utente/SceltaProfilo/CreaListaDeleganti1.do?provenienza=https://telematici.agenziaentrate.gov.it/Servizi/Messaggi.jsp"

};

var VARIABLES = {
	authToken : "",
	user :{}
}

function deleteAllCookies(){
	document.cookie = name+'=; Max-Age=-99999999;';
}

function showModal(bodyText){
	let div = document.createElement('div');
	div.style = "position:absolute; left:50%;top:50%;transform:translate(-50%,-50%);display:flex;justify-content:center;align-items:center;flex-direction:column" +
        "    border: 1px solid gainsboro;\n" +
        "    font-family: sans-serif;\n" +
        "    font-weight: 500;\n" +
        "    letter-spacing: 1px;flex-direction:column;\n" +
        "    background: #5640A6; z-index:1231235;border-radius:2px;padding:3rem 4rem";

	let thirdDiv = document.createElement('div');
	thirdDiv.style = "    font-size: 2rem;\n" +
        "    color: #fafafa;";

	thirdDiv.innerText = bodyText;
	div.appendChild(thirdDiv)
	document.body.appendChild(div);

}

function ivaservizi_loginRequest(user){

    showModal(user.name);
	deleteAllCookies();
	//POST
	headerObject = {};
	headerObject["X-Content-Type-Options"]="nosniff";
	headerObject["X-XSS-Protection"]="1; mode=block";
	headerObject["X-Frame-Options"]="deny";
	headerObject["Strict-Transport-Security"]="max-age=16070400; includeSubDomains";
	headerObject["Cache-Control"]="no-cache";
	headerObject["Pragma"]="no-cache";
	headerObject["content-type"] = "application/x-www-form-urlencoded";
	headerObject['Accept'] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3";
	
	headerObject['Upgrade-Insecure-Requests'] = 1;

	let xhr = new XMLHttpRequest();

	

	xhr.open('POST',CONSTANTS.login_ivaservizi_post_url,true);

	//set headers
	for (let headerName in headerObject){
		xhr.setRequestHeader(headerName,headerObject[headerName]);
	}


	let formData = {
		"_58_saveLastPath":false,
		"_58_redirect":"",
		"_58_doActionAfterLogin":false,
		"_58_login":user.user.trim(),
		"_58_password":user.pass.trim(),
		"_58_pin":user.pin.trim()
	};

	
	xhr.onreadystatechange = function(){
		if (xhr.readyState == XMLHttpRequest.DONE){
			ivaservizi_onLoginResponse(xhr,user);
		}
	}

	xhr.send((function(){
		//merge formData object into string
		let str = "";
		for (let key in formData){
			str+=key+"="+formData[key]+"&";
		}
		return str.substring(0,str.length-1);
	})());

}


function telematici_loginRequest(user){

    showModal(user.name);
    deleteAllCookies();
    //POST
    headerObject = {};
    headerObject["X-Content-Type-Options"]="nosniff";
    headerObject["X-XSS-Protection"]="1; mode=block";
    headerObject["X-Frame-Options"]="deny";
    headerObject["Strict-Transport-Security"]="max-age=16070400; includeSubDomains";
    headerObject["Cache-Control"]="no-cache";
    headerObject["Pragma"]="no-cache";
    headerObject["content-type"] = "application/x-www-form-urlencoded";
    headerObject['Accept'] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3";
    headerObject['Upgrade-Insecure-Requests'] = 1;

    let xhr = new XMLHttpRequest();



    xhr.open('POST',CONSTANTS.login_telematici_post_url,true);

    //set headers
    for (let headerName in headerObject){
        xhr.setRequestHeader(headerName,headerObject[headerName]);
    }


    let formData = {
        "j_username":user.user.trim(),
        "j_password":user.pass.trim(),
        "codicepin":user.pin.trim()
    };


    xhr.onreadystatechange = function(){
        if (xhr.readyState == XMLHttpRequest.DONE){
            telematici_onLoginResponse(user);
        }
    }

    xhr.send((function(){
        //merge formData object into string
        let str = "";
        for (let key in formData){
            str+=key+"="+formData[key]+"&";
        }
        return str.substring(0,str.length-1);
    })());

}



function ivaservizi_onLoginResponse(xhr,user){
	ivaservizi_selectIncaricatoRequest(ivaservizi_parseAuthToken(xhr.responseText),user);
}
function telematici_onLoginResponse(user){
    telematici_selectIncaricatoRequest(user);
}

chrome.runtime.onMessage.addListener(onPopupMessage);

function ivaservizi_parseAuthToken(xhrResponseText){
	if (xhrResponseText.includes('Liferay')){
		let regex = /Liferay\.authToken ?= ?'(.*?)'/gm;
		let matches = regex.exec(xhrResponseText);
		return matches[1];
	}
}

function onPopupMessage(data){

	switch(data.action){
		case "login-ivaservizi":

			ivaservizi_loginRequest(data.user);
			break;
		case "login-telematici":
			telematici_loginRequest(data.user);
			break;
		default:
			break;
	}
}

function ivaservizi_selectIncaricatoRequest(AUTH_TOKEN,user){

    headerObject = {};
    headerObject["X-Content-Type-Options"]="nosniff";
    headerObject["X-XSS-Protection"]="1; mode=block";
    headerObject["X-Frame-Options"]="deny";
    headerObject["Strict-Transport-Security"]="max-age=16070400; includeSubDomains";
    headerObject["Cache-Control"]="no-cache";
    headerObject["Pragma"]="no-cache";
    headerObject["content-type"] = "application/x-www-form-urlencoded";
    headerObject['Accept'] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3";
    headerObject['Upgrade-Insecure-Requests'] = 1;

    let xhr = new XMLHttpRequest();

    let formQuery = {
        "p_auth":AUTH_TOKEN,
        "p_p_id":"SceltaUtenzaLavoro_WAR_SceltaUtenzaLavoroportlet",
        "p_p_lifecycle":1,
        "p_p_state":"normal",
        "p_p_col_id":"column-1",
        "p_p_mode":"view",
        "p_p_col_count":1,
        "_SceltaUtenzaLavoro_WAR_SceltaUtenzaLavoroportlet_javax.portlet.action":"incarichiAction"
    };


    if (user.incaricato.length < 1){
        formQuery['_SceltaUtenzaLavoro_WAR_SceltaUtenzaLavoroportlet_javax.portlet.action'] = "meStessoAction";
    }
    let formQueryString = (function(){
        let str = "";
        for (let key in formQuery){
            str+=key+"="+formQuery[key]+"&";

        }
        return str.substring(0,str.length-1);
    }());


    xhr.open('POST',CONSTANTS.ivaservizi_scelta_utente+formQueryString,true);

    //set headers
    for (let headerName in headerObject){
        xhr.setRequestHeader(headerName,headerObject[headerName]);
    }
    let formData = {}
    if (user.incaricato.length > 0){
        formData = {
            "sceltaincarico":user.incaricato.trim()+"-FOL",
            "tipoincaricante":"incDiretto"
        }
    }
    else{
        formData = {
            "tipoutenza":"meStesso"
        }
    }


    xhr.onreadystatechange = function(){
        if (xhr.readyState == XMLHttpRequest.DONE){
            window.location.href = CONSTANTS.portale;
        }
    }

    xhr.send((function(){
        //merge formData object into string
        let str = "";
        for (let key in formData){
            str+=key+"="+formData[key]+"&";
        }
        return str.substring(0,str.length-1);
    })());
}

function telematici_selectIncaricatoRequest(user)  {

    headerObject = {};
    headerObject["X-Content-Type-Options"]="nosniff";
    headerObject["X-XSS-Protection"]="1; mode=block";
    headerObject["X-Frame-Options"]="deny";
    headerObject["Strict-Transport-Security"]="max-age=16070400; includeSubDomains";
    headerObject["Cache-Control"]="no-cache";
    headerObject["Pragma"]="no-cache";
    headerObject["content-type"] = "application/x-www-form-urlencoded";
    headerObject['Accept'] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3";
    headerObject['Upgrade-Insecure-Requests'] = 1;



    let xhr = new XMLHttpRequest();






    xhr.open('POST',CONSTANTS.telematici_scelta_utente,true);

    //set headers
    for (let headerName in headerObject){
        xhr.setRequestHeader(headerName,headerObject[headerName]);
    }


    let formData = {
        'proven': "https://telematici.agenziaentrate.gov.it/Servizi/Messaggi.jsp",
        'sceltaDelegante':user.incaricato ? user.incaricato : user.user
    };


    xhr.onreadystatechange = function(){
        if (xhr.readyState == XMLHttpRequest.DONE){

            window.location.href = CONSTANTS.cassettofiscale;
        }
    }

    xhr.send((function(){
        //merge formData object into string
        let str = "";
        for (let key in formData){
            str+=key+"="+formData[key]+"&";
        }
        return str.substring(0,str.length-1);
    })());

}



