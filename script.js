// VArmistaa että DOM on ladattu
document.addEventListener("DOMContentLoaded", function () {
    console.log("JS valmis.");


    // Luodaan painikkeelle eventListener
    const button = document.getElementById("delayButton");
    if (button) {
        button.addEventListener("click", function  () {
            console.log("Painettu.")
            setTimeout(afterTimeout, 5000);
        });
    }
});

//Printtaa konsolille annetun tekstin
function afterTimeout() {
    console.log("5s on kulunut!")
}