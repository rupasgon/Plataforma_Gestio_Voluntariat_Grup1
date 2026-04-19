

window.onload = function(){
    getDades();
    
}

async function getDades(){
    let resposta;
    let dades;

    try{
        resposta = await fetch("BACKEND_URL");
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