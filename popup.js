window.addEventListener('load', function(){
    initializeEverything();
});

async function initializeEverything(){

    //load existing users

    window.version = "3";
    await initializeLicense();




    await initializeTabs();



    let showAddNewUserBtn = document.getElementById('showAddNewUser');
    document.getElementById('goToFattureEmesse').onclick = goToFattureEmesse;
    document.getElementById('goToFattureRicevute').onclick = goToFattureRicevute;

    document.getElementById('switch_fatture').onchange = async function(){
        let storage = await getStorage();
        storage.switch_fatture = this.checked;
        await setStorage(storage);
    }

    getStorage().then(storage=>{
        if (storage.loginType){
            let loginType = document.getElementById(storage.loginType);
            if (loginType){
                loginType.checked = true;
            }
        }
    });

    document.getElementById('loginIvaservizi').onchange = function(){
        let self = this;
        if (self.checked){
            getStorage().then(storage=>{
                storage.loginType = "loginIvaservizi";
                setStorage(storage).then();
            });
        }
    };
    document.getElementById('loginCassettoFiscale').onchange = function(){
        let self = this;
        if (self.checked) {
            getStorage().then(storage => {
                storage.loginType = "loginCassettoFiscale";
                setStorage(storage).then();
            });
        }
    };
    let addNewUser = document.getElementById('addNewUser');
    let gotoHomeButtons = document.getElementsByName('gotoHome');
    let search = document.getElementById('search');



    search.onchange = function(){
        loadUsersIntoTable(this.value);
    }
    for (let i =0; i< gotoHomeButtons.length; i++){
        gotoHomeButtons[i].onclick = gotoHome;
    }


    //bind button event listeners
    showAddNewUserBtn.onclick = function(){
        showAddNewUser();
    };

    addNewUser.onclick = addUser;

    let allInputs = document.querySelectorAll('input[data-user]');

    //bind event to save to storage inputs

    for (let i=0; i<allInputs.length;i++){
        allInputs[i].onchange = async function(){
            let key = this.getAttribute('name');

            let value = "";
            if (this.value){
                value = this.value.trim();
            }
            else{
                value = "";
            }
            let storage = await getStorage()
            storage.savedInputs[key] = value;
            await setStorage(storage);
        }
    }
}

async function initializeTabs(){
    document.getElementById('switch-tab-panel').onclick = function(){
        switchTab('panel');
    };

    document.getElementById('switch-tab-license').onclick = function(){
        switchTab('license');
    };
    
    let storage = await getStorage();


    document.getElementById('switch_fatture').checked = storage.switch_fatture;

    if (!window._isset){
        await switchTab("license");
        return;
    }
    if (storage.activeTab){
        await switchTab(storage.activeTab);
    }
}

function goToFattureRicevute(){
    chrome.tabs.query(
        //query filter
        {
            "active":true,
            "currentWindow":true,
        },
        //callback function
        function(tabs){
            if (tabs.length < 1){
                alert("E' necessario trovarsi sulla pagina Agenzia delle Entrate per poter effettuare l'accesso.\nConsiglio: clicca sul link 'portale' sottostante alla tabella.");
            }
            else{
                chrome.tabs.update(tabs[0].id,{
                    url:"https://ivaservizi.agenziaentrate.gov.it/cons/cons-web/?v="+new Date().getTime()+"#/fatture/ricevute"
                });
            }
        }
    );
}
function goToFattureEmesse(){
    chrome.tabs.query(
        //query filter
        {
            "active":true,
            "currentWindow":true,
        },
        //callback function
        function(tabs){
            if (tabs.length < 1){
                alert("E' necessario trovarsi sulla pagina Agenzia delle Entrate per poter effettuare l'accesso.\nConsiglio: clicca sul link 'portale' sottostante alla tabella.");
            }
            else{
                chrome.tabs.update(tabs[0].id,{
                    url:"https://ivaservizi.agenziaentrate.gov.it/cons/cons-web/?v="+new Date().getTime()+"#/fatture/emesse"
                });
            }
        }
    );
}
async function showAddNewUser(data){

    let storage= await getStorage();
    if (!window._isset){
        switchTab('license');
        return;
    }

	//if data has value, it means we're editing user
	let addNewUserForm = document.getElementById('addNewUserForm');
    addNewUserForm.classList.remove('d-none');
    addNewUserForm.classList.add('d-flex');
    document.getElementById('showAddNewUser').style.display = "none";
    let abortAddNewUser =  document.getElementById('abortAddNewUser');
	let infoTip = document.getElementById('infoTip');
    let saveButton = document.getElementById('addNewUser');
    if (data){
    	infoTip.innerText = "Modifica utenza "+data.name;
    	saveButton.innerText = "Salva modifiche";
		saveButton.onclick = async function(){
			await addUser(data.id);
			await hideAddNewUser();
		};
		abortAddNewUser.innerText = "Annulla modifiche";
        abortAddNewUser.onclick = async function(){
            await hideAddNewUser();
            let storage = await getStorage();
            storage.savedInputs = {};
            await setStorage(storage);
        };
	}
	else{
        infoTip.innerText = "Inserimento nuova utenza";
        saveButton.innerText = "Aggiungi utenza";

        saveButton.onclick = function(){
        	addUser();
		}
        abortAddNewUser.innerText = "Annulla";
        abortAddNewUser.onclick = async function(){
            await hideAddNewUser();
        };
	}

    window.scrollTo(0,document.body.scrollHeight);

}

async function hideAddNewUser(){
    let storage = await getStorage();
    storage.savedInputs = {};
    await setStorage(storage);
    let addNewUserForm = document.getElementById('addNewUserForm');
    addNewUserForm.classList.add('d-none');
    addNewUserForm.classList.remove('d-flex');
    document.getElementById('showAddNewUser').style.display = "block";
    document.documentElement.scrollTop = 0;
}

async function setLicense(license){
    let storage=  await getStorage();
    storage.l = license.trim();
    await setStorage(storage);
}
async function initializeLicense(){
    let storage = await getStorage();
    let licenseNumberEl =document.getElementById('current-license');
    let statusEl = document.getElementById('license-status');
    if (storage.l){
        licenseNumberEl.innerHTML = storage.l;
        let res = await reqServ("v");


        if (!res.status || !res.status.status || (res.status.status != "0" && res.status.status != "k" && res.status.status != "2")){
            statusEl.innerHTML = "Licenza non valida";
            showLicenseInputForm();
            document.getElementById('activate-license-button').classList.add('d-none');
        }
        else if (res.status.status == "0"){
            statusEl.innerHTML  = "";
            let p = document.createElement('p');
            p.innerText = "Licenza scaduta. Rinnova la tua licenza effettuando un nuovo ordine del prodotto su";
            statusEl.appendChild(p);
            let aToLink = document.createElement('a');
            aToLink.href = "#";
            aToLink.onclick = function(){
                goSomewhere('https://www.quidextension.com/store/quid-invoice-download');
            };
            aToLink.innerHTML = "https://www.quidextension.com/store/quid-invoice-download";

            statusEl.appendChild(aToLink);

            let otherP = document.createElement('p');
            otherP.innerText = "oppure";
            otherP.style.setProperty('margin-top','1rem');
            statusEl.appendChild(otherP);

            let activateNewButton = document.getElementById('activate-license-button');
            activateNewButton.innerText = "attiva un altra licenza";
            activateNewButton.classList.remove('d-none');
            activateNewButton.onclick = function(){
                showLicenseInputForm();
            }

        }
        else if(res.status.status === "k"){
            if (res.status.version){
                if (res.status.version > window.version){
                    alert('Ci sono nuovi aggiornamenti! Vai sul sito quidextension.com e scarica l\'ultima versione dalla tua area download');
                }
            }
            document.getElementById('activate-license-button').classList.add('d-none');
            window._isset = true;
            let date = new Date(res.status.l*1000);
            let str = "Attivo fino al " + date.getDate() + "/" + (date.getMonth()+1) + "/"+date.getUTCFullYear();
            statusEl.innerHTML = str;
            hideLicenseInputForm();
            window.quid_loaded_users = res.status.users;
            await loadUsersIntoTable();
        }
        else if (res.status.status === "2"){
            storage.l = "";
            await setStorage(storage);
            statusEl.innerHTML = "Hai superato il limite di attivazioni a disposizione. Effettua l'acquisto di una nuova licenza su quidextension.com";
            document.getElementById('activate-license-button').classList.add('d-none');
            showLicenseInputForm();
        }


    }
    else{
        licenseNumberEl.innerHTML = "Nessuna";
        statusEl.innerHTML = "";
        let p = document.createElement('p');
        p.innerText = "Attivazione licenza richiesta. Se hai acquistato una licenza precedentemente, potrai trovarla a questo link:";
        statusEl.appendChild(p);
        let aToLink = document.createElement('a');
        aToLink.href = "#";
        aToLink.onclick = function(){
            goSomewhere('https://www.quidextension.com/profilo');
        };
        aToLink.innerHTML = "https://www.quidextension.com/profilo";
        statusEl.appendChild(aToLink);
        showLicenseInputForm();
    }

    document.getElementById('activate-license').onclick = async function () {
        await setLicense(document.getElementById('license-input').value);
        initializeLicense(true);
    }








}

function showLicenseInputForm(){
    let licenseInput =document.getElementById('license-input-form');
    licenseInput.classList.remove('d-none');
    licenseInput.classList.add('d-flex');
}
function hideLicenseInputForm(){
    let licenseInput = document.getElementById('license-input-form');
    licenseInput.classList.add('d-none');
    licenseInput.classList.remove('d-flex');
}



async function addUser(){
	//get form params
        let storage= await getStorage();


		let inputs = document.querySelectorAll('input[data-user]');
		let data = {};
		for (let i=0; i<inputs.length;i++){
			data[inputs[i].getAttribute('name')] = inputs[i].value.trim();
		}

		if(data.name.length<1||data.name.length>255 || data.user.length < 1 || data.user.length > 255 ||
			data.pass.length < 1 || data.pass.length > 255 || data.pin.length > 255 || data.incaricato.length > 255)
		{
			alert("Controlla i dati inseriti e riprova.");
			return;
		}

        if (!data.incaricato){
		    data.incaricato = data.user;
        }




		let result = await reqServ('addUser',data);


		if (result['status'] === "ok"){
            //refresh user id inputs
            document.querySelectorAll('input:not(#search)').forEach(c=>{
                c.value = "";
            });
            //delete cache inputs
            delete storage.savedInputs;
            await setStorage(storage);

            await loadUsersIntoTable();



        }
	    else{
            //show error message on user interface
            document.getElementById('incorrect-data-error').classList.remove('d-none')
        }

        setTimeout(function () {
            window.scrollTo(0,document.body.scrollHeight);
        });
	
}
async function switchTab(id){
    if (id === "panel" && !window._isset){
        await switchTab("license");
        return;
    }
    let storage = await getStorage();
    storage.activeTab = id;
    await setStorage(storage);
    let tabs = document.querySelectorAll('[data-tab]');
    for(let i =0; i<tabs.length; i++){
        if (tabs[i].id == id){
            tabs[i].classList.remove('d-none');
            tabs[i].classList.add('d-flex');
        }
        else{
            tabs[i].classList.add('d-none');
            tabs[i].classList.remove('d-flex');
        }
    }
    document.querySelectorAll('.switch-tab').forEach(c=> {
        if (c.id !== "switch-tab-"+id){
            c.classList.remove('active');
        }
        else{
            c.classList.add('active');
        }
    });

    if (id == "panel"){
        await getStoredInputs();
    }
}


async function loadUsersIntoTable(filter){
	
	let tbody = document.querySelector('table tbody');
	while(tbody.firstChild){
		tbody.removeChild(tbody.firstChild);
	}


	let req = {};
    if (!window.quid_loaded_users){
        req = await reqServ('getusers');
    }
    else{
        req.status = window.quid_loaded_users;
        delete window.quid_loaded_users;
    }




	if (!Array.isArray(req.status) || req.status.length < 1){
	    if (!document.getElementById('no-user-found')){

            let p = document.createElement('p');
            p.innerText = "Nessuna utenza salvata";
            p.id = "no-user-found";
            p.className = "w-100 text-center font-weight-bolder text-muted";
            let table = document.getElementsByTagName('table')[0];
            document.querySelector('table').parentElement.insertBefore(p,document.getElementById('after-table'));
        }
	}
	else {
	    window._users = req.status;
		let p = document.getElementById('no-user-found');
		if (p){
			p.parentElement.removeChild(p);
		}
		let data = req.status;
		let users = Object.values(data).sort(function(a,b){
            var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
            if (nameA < nameB) //sort string ascending
                return -1;
            if (nameA > nameB)
                return 1;
            return 0;

		});
		for (let i =0; i<users.length; i++){

			if (filter){
				let mustSkip = true;
				filter = filter.trim().toLowerCase();
				if (filter.length > 0)
				if ((users[i].name.trim().toLowerCase().includes(filter) ||
						users[i].user.trim().toLowerCase().includes(filter) ||
						users[i].pass.trim().toLowerCase().includes(filter) ||
						users[i].pin.trim().toLowerCase().includes(filter) ||
						users[i].incaricato.trim().toLowerCase().includes(filter)
					))
					mustSkip = false;

				if (mustSkip)
					continue;
					
			}
			let tr = document.createElement('tr');

			let td0 = document.createElement('td');
			let a = document.createElement('a');
			a.href = "#";
			a.innerText = users[i].name;
			a.onclick = function(){

				authenticate(users[i]);
			};
			td0.appendChild(a);
			let td1 = document.createElement('td');
			td1.innerText =  users[i].user;
			let td2 = document.createElement('td');
			td2.innerText =  users[i].pass;
			let td3 = document.createElement('td');
			td3.innerText =  users[i].pin;
			let td4 = document.createElement('td');
			td4.innerText =  users[i].incaricato;

			//remove button
			let td5 = document.createElement('td');
			let flexDiv = document.createElement('div');
			flexDiv.className = "d-flex flex-row justify-content-center align-items-center";

            let signInIcon = document.createElement('i');
            signInIcon.className = "cursor-pointer fas fa-sign-in px-2 dark-grey-text";
            signInIcon.onclick = function(){
                authenticate(users[i]);
            };

			let removeIcon = document.createElement('i');
            removeIcon.className = "cursor-pointer fas fa-trash px-2 dark-grey-text";
            removeIcon.onclick = function(){
                deleteUser(users[i]);
            };

            let editIcon = document.createElement('i');
            editIcon.className = "cursor-pointer fas fa-pen px-2 dark-grey-text";
            editIcon.onclick = function(){
            	editUser(users[i]);
			};
            flexDiv.appendChild(signInIcon);
            flexDiv.appendChild(removeIcon);
            flexDiv.appendChild(editIcon);

            td5.appendChild(flexDiv);

			tr.appendChild(td0);
			tr.appendChild(td1);
			tr.appendChild(td2);
			tr.appendChild(td3);
			tr.appendChild(td4);
			tr.appendChild(td5);

			tbody.appendChild(tr);
		}
	}
	
}

async function getStoredInputs(){
	let storage =  await getStorage();

	if (storage.savedInputs){

		let mustShowAddUser  = false;
		for(let i in storage.savedInputs){


            if (storage.savedInputs[i]){
                document.querySelector('input[name="'+i+'"]').value = storage.savedInputs[i];
                mustShowAddUser = true;
			}
		}
		if (mustShowAddUser){

            if (storage.savedInputs['id'])
		        await showAddNewUser(storage.savedInputs);
            else{
                showAddNewUser();
            }
            setTimeout(function () {
                window.scrollTo(0,document.body.scrollHeight);
            });

		}


	}


}

async function editUser(data){

	for (let key in data){
		let el = document.querySelector('input[data-user][name="'+key+'"]');
		if (el)
		{
			el.value = data[key];
			el.onchange();
        }
	}

	let storage = await getStorage();
    storage.savedInputs = data;
    await setStorage(storage);

	await showAddNewUser(data);
	document.getElementById('abortAddNewUser').onclick = async function(){
		document.querySelectorAll('input[data-user]').forEach(c=> c.value = "");
		hideAddNewUser();
	};
}
async function deleteUser(user, askForConfirm = true){
	if (askForConfirm){
        let sure = confirm("Sei sicuro di voler cancellare "+user.name+"?");
        if (!sure) return;
	}
	await reqServ('deleteuser',{id:user.id});
	loadUsersIntoTable();
}

function showLoading(){
    document.getElementById('loading').style.display = "flex";
}
function hideLoading(){
    document.getElementById('loading').style.display = "none";
}

function getStorage(){
	return new Promise(function(resolve){
		chrome.storage.sync.get('age-users',function(cb){
            if (!cb['age-users']){
                cb['age-users'] = {};
            }
            if (!cb['age-users']['users']){
                cb['age-users']['users']= {};
            }

            if (!cb['age-users']['savedInputs']){
                cb['age-users']['savedInputs']= {};
            }
            if (! ("switch_fatture" in cb['age-users'])){
                cb['age-users'].switch_fatture = true;
            }
			resolve(cb['age-users']);
		});
	});
}


async function initializeScreen(){
    let l = await reqServ('v');

}



function setStorage(storage){
	return new Promise(function(resolve){
		chrome.storage.sync.set({'age-users':storage},resolve);
	});
	
}

function gotoHome(){
    chrome.tabs.query(
        //query filter
        {
            "active":true,
            "currentWindow":true,
        },
        //callback function
        function(tabs){
            if (tabs.length < 1){
                alert("E' necessario trovarsi sulla pagina Agenzia delle Entrate per poter effettuare l'accesso.\nConsiglio: clicca sul link 'portale' sottostante alla tabella.");
            }
            else{
                chrome.tabs.update(tabs[0].id,{
                    url:"https://ivaservizi.agenziaentrate.gov.it/portale/"
                });
            }
        }
    );

}

function goSomewhere(link){
    chrome.tabs.query(
        //query filter
        {
            "active":true,
            "currentWindow":true,
        },
        //callback function
        function(tabs){

            chrome.tabs.update(tabs[0].id,{
                url:link
            });

        }
    );

}

function logout(isCassettoFiscale){

	return new Promise(function(callback){
		if (isCassettoFiscale){
            var listener = function(tabId, info){
                if (info.status == "complete"){
                    chrome.tabs.onUpdated.removeListener(listener);
                    startOtherListener();
                }
            }

            chrome.tabs.onUpdated.addListener(listener);
            chrome.tabs.query(
                //query filter
                {
                    "active":true,
                    "currentWindow":true,
                },
                //callback function
                function(tabs){
                    if (tabs.length < 1){
                        alert("E' necessario trovarsi sulla pagina Agenzia delle Entrate per poter effettuare l'accesso.\nConsiglio: clicca sul link 'portale' sottostante alla tabella.");
                    }
                    else{
                        chrome.tabs.update(tabs[0].id,{
                            url:"https://telematici.agenziaentrate.gov.it/Servizi/CloseSessions"
                        });
                    }
                }
            );


            function startOtherListener(){
                var secondListener = function(tabId,info){
                    if (info.status == "complete"){

                        chrome.tabs.onUpdated.removeListener(secondListener);

                        callback();
                    }
                }
                chrome.tabs.onUpdated.addListener(secondListener);
                chrome.tabs.query(
                    //query filter
                    {
                        "active":true,
                        "currentWindow":true,
                    },
                    //callback function
                    function(tabs){
                        if (tabs.length < 1){
                            alert("E' necessario trovarsi sulla pagina Agenzia delle Entrate per poter effettuare l'accesso.\nConsiglio: clicca sul link 'portale' sottostante alla tabella.");
                        }
                        else{
                            chrome.tabs.update(tabs[0].id,{
                                url:"https://telematici.agenziaentrate.gov.it/Main/login.jsp"
                            });
                        }
                    }
                );
            }
		}
		else{
            var listener = function(tabId, info){

                if (info.status == "complete"){
                    callback();
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            }
            chrome.tabs.onUpdated.addListener(listener);
            chrome.tabs.query(
                //query filter
                {
                    "active":true,
                    "currentWindow":true,
                },
                //callback function
                function(tabs){
                    if (tabs.length < 1){
                        alert("E' necessario trovarsi sulla pagina Agenzia delle Entrate per poter effettuare l'accesso.\nConsiglio: clicca sul link 'portale' sottostante alla tabella.");
                    }
                    else{
                        chrome.tabs.update(tabs[0].id,{
                            url:"https://ivaservizi.agenziaentrate.gov.it/portale/c/portal/logout"
                        });
                    }
                }
            );
		}

	});




}

async function authenticate(user){

    let storage = await getStorage();
    if (window._isset){
        var isCassettoFiscale = document.getElementById('loginCassettoFiscale').checked;
        await logout(isCassettoFiscale);
        chrome.tabs.query(
            //query filter
            {
                "active":true,
                "currentWindow":true
            },
            //callback function
            function(tabs){
                chrome.tabs.sendMessage(tabs[0].id,{
                    "action": isCassettoFiscale ? "login-telematici" : "login-ivaservizi",
                    "user":user
                });
            }
        );
        window.close();
    }




}


var genId = function () {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
};



function reqServ(action,data){

    return new Promise(async function (resolve) {
        let storage = await getStorage();

        if (!storage.p){
            storage.p = genId();
            await setStorage(storage);
        }
        let xhr = new XMLHttpRequest();

        xhr.open('POST',"https://www.quidextension.com/api/api.php?_="+new Date().getTime(),true);

        if (!data){
            data = [];
        }
        let formData = {
            'l': storage.l,
            'a':action,
            'd':data,
            "p":storage.p
        };

        showLoading();
        xhr.onreadystatechange = function(){
            if (xhr.readyState == XMLHttpRequest.DONE){
                try{
                    hideLoading();
                    let json = JSON.parse(xhr.responseText);
                    resolve(json);
                }
                catch(e){
                    hideLoading();
                    resolve(xhr.responseText);
                }
            }
        }

        xhr.send(JSON.stringify(formData));
    });
}
