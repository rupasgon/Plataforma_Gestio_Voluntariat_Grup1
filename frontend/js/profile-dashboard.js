

window.onload = function(){
    getDades();
    
}

//Funció per accedir a les dades a partir de l'usuari que ha fet el login.
async function getDades(){
    let resposta;
    let dades;

    try{
        resposta = await fetch("http://localhost:3000/profile/me");
        if (resposta.ok){
            dades = await resposta.json();
            console.log(dades);
            showDades(dades);
        } else {
        console.error("Error en la resposta");
        }
    }catch (error){
        console.error("Error de connexió: ", error);
    }  
}

//Funció per mostrar les dades de l'usuari actiu.
function showDades(dades){
    document.getElementById("nom").textContent = dades.nom;
    document.getElementById("cognoms").textContent = dades.cognoms;
    document.getElementById("email").textContent = dades.email;
    document.getElementById("telefon").textContent = dades.telefon;
    document.getElementById("parroquia").textContent = dades.parroquia;
    document.getElementById("data_naixement").textContent = dades.data_naixement;
    document.getElementById("disponibilitat").textContent = dades.disponibilitat;
    document.getElementById("observacions").textContent = dades.observacions;
}