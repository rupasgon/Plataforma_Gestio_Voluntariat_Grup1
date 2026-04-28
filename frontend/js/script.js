/**
 * @file script.js
 * @description Controla les interaccions de la pàgina:
 * - Funció 1: Efecte actiu del menú de navegació quan l'usuari passa el ratolí.
 * - Funció 2: Reproducció de sons quan l'usuari clica els perfils Voluntari o Aprenent.
 * @author Antoni Castillo Llauradó
 */


/**
 * Funció principal que s'executa quan el DOM ha carregat completament.
 * Inicialitza els esdeveniments del menú de navegació i dels perfils d'usuari.
 *
 * @function window.onload
 * @returns {void}
 */
window.onload = function () {

    /**
     * =====================================================
     * FUNCIÓ 1 - EFECTE ACTIU AL MENÚ DE NAVEGACIÓ
     * =====================================================
     */

    /**
     * Selecciona tots els enllaços del menú amb la classe nav-link.
     * @type {NodeListOf<HTMLAnchorElement>}
     */
    const navLinks = document.querySelectorAll('.nav-pills .nav-link');

    /**
     * Recorre cada enllaç del menú i afegeix esdeveniments
     * per activar o desactivar la classe "active".
     */
    navLinks.forEach(link => {

        /**
         * Esdeveniment que s'activa quan el ratolí passa per sobre del link.
         * Activa visualment l'enllaç actual.
         *
         * @event mouseover
         */
        link.addEventListener('mouseover', function () {

            // elimina la classe active de tots els links
            navLinks.forEach(l => l.classList.remove('active'));

            // afegeix la classe active al link actual
            this.classList.add('active');
        });


        /**
         * Esdeveniment que s'activa quan el ratolí surt del link.
         * Desactiva l'estil visual.
         *
         * @event mouseout
         */
        link.addEventListener('mouseout', function () {

            // elimina la classe active
            this.classList.remove('active');
        });

    });



    /**
     * =====================================================
     * FUNCIÓ 2 - SONS DELS PERFILS
     * =====================================================
     */

    /**
     * Element HTML de la imatge del perfil voluntari.
     * @type {HTMLElement|null}
     */
    const voluntari = document.getElementById("voluntari");

    /**
     * Element HTML de la imatge del perfil aprenent.
     * @type {HTMLElement|null}
     */
    const aprenent = document.getElementById("aprenent");

    /**
     * Element d'àudio per al so del voluntari.
     * @type {HTMLAudioElement|null}
     */
    const soVoluntari = document.getElementById("soVoluntari");

    /**
     * Element d'àudio per al so de l'aprenent.
     * @type {HTMLAudioElement|null}
     */
    const soAprenent = document.getElementById("soAprenent");

    /**
     * Afegeix un esdeveniment click a la imatge del voluntari
     * per reproduir el seu so corresponent.
     */
    if (voluntari) {

        voluntari.addEventListener("click", function () {

            // reinicia el temps del so
            soVoluntari.currentTime = 0;

            // reprodueix el so
            soVoluntari.play();
        });

    }


    /**
     * Afegeix un esdeveniment click a la imatge de l'aprenent
     * per reproduir el seu so corresponent.
     */
    if (aprenent) {

        aprenent.addEventListener("click", function () {

            // reinicia el temps del so
            soAprenent.currentTime = 0;

            // reprodueix el so
            soAprenent.play();
        });

    }

};
