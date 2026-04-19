

window.onload = function(){
    getDades();
    
}

function getDades(){
    /**
     * fer petició al backend
    si resposta OK:
        obtenir dades
        cridar mostrarPerfil(dades)
    si error:
        mostrar error
     */
    

    showDades();
}


function showDades(dades){
    /**
     * posar dades.nom a #nom
    posar dades.cognoms a #cognoms
    posar dades.email a #email
    posar dades.telefon a #telefon
    ...
     */

}