import { fetchJson, getUrlParam, getIssueData, period2Long, menuActiveToggle } from '/js/m_utilites.js';
import dataStore from '/js/m_data_store.js';

  

// TODO: move to m_data_store.js
function fillArchiveList(data){
    const archiveContainer = document.querySelector('.th-archives');
    // Clear the list
    while (archiveContainer.firstChild) {
        archiveContainer.removeChild(archiveContainer.firstChild);
    }
    data.forEach(d=>{
        const li = document.createElement("li");
        li.className = 'h_over:';
        const tagName = d.fileOnly?"i":"a";
        li.innerHTML = `<${tagName} href="/?period=${d.period}" class="${d.fileOnly?'':'underline text-blue-600'}">
                ${period2Long(d.period)} - n°${d.issueNumber}
            </${tagName}> 
            (<a href="/archive/${d.file}" target="_blank" class="underline text-blue-600">télécharger</a>)`;
        archiveContainer.append(li);
    })
    // <li class="hover:text-blue-600"><a href="#">Février 2024 - n°340</a></li>
}

// function observeElementResize(element, callback){
//     // call it anyway before event is arrived
//     callback();
//     const el = document.querySelector(element);
//     window.addEventListener('resize', callback);
//     const observer = new ResizeObserver(callback);
//     observer.observe(el);
// }

const getDataJob = (new Promise((resolve, refect)=>{
    const urlPeriod = getUrlParam('period');
    if(urlPeriod){
        resolve(urlPeriod);
        return ;
    }
    
    // TODO: receive current issue from archive.json
    // receiving last issue
    fetchJson('current.json')
        .then(data=>{
            dataStore.currentNumber = data.numero;
            dataStore.currentFolder = data.period;
            resolve(data.period);
        });
}))
    .then(getIssueData)
    .then(data=>{
        dataStore.currentIssue = data;
    });


/* ======== Options ========= */





document.addEventListener('DOMContentLoaded', function() {
    console.log('main.js: DOMContentLoaded');

    const menuToggle = document.getElementById('menu-toggle');
    menuToggle.addEventListener('click', () => {
        menuActiveToggle();
    });      
    
    /* Main Menu logic */
    // adds/edits an issue 
    const addButton = document.querySelector('.btn-add-issue');
    addButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const { showAddIssueDialog } = await import(`/js/m_add_issue.js?t=${Math.random()}`);
        showAddIssueDialog();
    });

    
    const optionsButton = document.querySelector('.btn-options');
    optionsButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const { showOptions } = await import(`/js/m_options.js?t=${Math.random()}`);
        // constructOptions();
        showOptions();
        menuActiveToggle();
    });

    getDataJob
        .then(()=>{
            const data = dataStore.currentIssue;
            // issue2Page(data);

        });

    fetchJson('archive.json')
        .then(fillArchiveList);

    // loadQuill() 
    //     .then(issueEditorPreparation);

});
