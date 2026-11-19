/* =========================================================
   AUTHENTICATION & ROLE GUARD
   ========================================================= */
(function enforceAuthentication() {
    // localStorage eken login wela inna kenage wisthara gannawa
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    const loggedInRole = localStorage.getItem('loggedInRole');
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();

    // login wela nathnam kelinma login page ekata yawanawa
    if (!loggedInUserId || !loggedInRole) {
        window.location.replace('index.html');
        return;
    }

    // user kenek admin page ekata enna haduwoth eliyata danawa
    if (currentPage === 'admin_dashboard.html' && loggedInRole !== 'ADMIN') {
        localStorage.removeItem('loggedInUserId');
        localStorage.removeItem('loggedInRole');
        window.location.replace('index.html');
        return;
    }

    // admin kenek user page ekata giyoth eliyata danawa
    if (currentPage === 'user_dashboard.html' && loggedInRole !== 'USER') {
        localStorage.removeItem('loggedInUserId');
        localStorage.removeItem('loggedInRole');
        window.location.replace('index.html');
        return;
    }
})();

// logout wela back button ebuwama aye athulata ena eka nawaththanawa
window.addEventListener('pageshow', function (event) {
    if (event.persisted || !localStorage.getItem('loggedInUserId') || !localStorage.getItem('loggedInRole')) {
        window.location.replace('index.html');
    }
});