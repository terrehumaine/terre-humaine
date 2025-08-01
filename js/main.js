window.TH_TOKEN = new Date().getTime();
const { 
    fetchJson, getUrlParam, getIssueData, period2Long, 
    menuActiveToggle
} = await import(`/js/m_utilites.js?t=${window.TH_TOKEN}`);
// import dataStore from '/js/m_data_store.js';
const { dataStore } = await import(`/js/m_data_store.js?t=${window.TH_TOKEN}`);
// import { issue2Page } from "/js/m_page_manipulation.js";
const { issue2Page, removeAllChildren } = await import(`/js/m_page_manipulation.js?t=${window.TH_TOKEN}`);

  

// TODO: move to m_data_store.js
function fillArchiveList(data){
    const archiveContainer = document.querySelector('.th-archives');
    // Clear the list
    removeAllChildren(archiveContainer);

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
}

function getCurrentIssue(archiveData, certainPeriod){
    return archiveData.find(d => d.status === "current");
}

const getDataJob = fetchJson(`/archive.json?t=${window.TH_TOKEN}`)
    .then(archiveData=>{
        fillArchiveList(archiveData);
        const certainPeriod = getUrlParam('period');
        if(certainPeriod){
            return certainPeriod;
        }
        const currentData = getCurrentIssue(archiveData, certainPeriod);
        return currentData.period;
    })
    .then(getIssueData)
    .then(data=>{
        dataStore.currentIssue = data;
    });

// dataStore setup
dataStore.currentIssue_handler = issue2Page;

function onDOMContentLoaded() {
    console.log('main.js: DOMContentLoaded');

    const menuToggle = document.getElementById('menu-toggle');
    menuToggle.addEventListener('click', () => {
        menuActiveToggle();
    });      
    
    /* Main Menu logic */
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
        showOptions();
        menuActiveToggle();
    });

    // get the current issue data
    getDataJob
        .then(() => {
            const data = dataStore.currentIssue;
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
} else {
    onDOMContentLoaded();
}
