

document.addEventListener("DOMContentLoaded", function() {

    document.querySelector('.filter_tv').addEventListener("click", (function(e) {
        document.querySelector('.filter_serie').classList.remove('hidden');
    


    }));


    document.querySelector('.filter_serie').addEventListener("click", (function(e) {
        document.querySelector('.filter_tv').classList.add('hidden');
    }));

}
    
