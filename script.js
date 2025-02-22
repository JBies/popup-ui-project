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

    // Demo siitä, miten popup aukeaa ajastetusti
    
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('popup').style.display = 'block';

    printPopups();

    //let pvm = document.getElementById("startDate").value;
    //console.log("'"+pvm+"'");
}

function printPopups() {
    fetch('/api/popups')
        .then(response => response.json())
        .then(data => {
            const popupList = document.getElementById('popups');
            //let parsedLst = JSON.parse(popupList);
            console.log(popupList);
        })
    };