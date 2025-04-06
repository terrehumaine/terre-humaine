import { dataStore } from '/js/m_data_store.js';

const { pushFilesToGitHub } = await import(`/js/m_github_api.js?t=${new Date().getTime()}`);

async function showOptions() {
    const existingModal = document.getElementById('options-modal');
    if (existingModal) {
        existingModal.classList.remove('hidden');
        return;
    }

    // Fetch the archive data
    let archiveData;
    try {
        const response = await fetch('archive.json');
        archiveData = await response.json();
    } catch (error) {
        console.error('Failed to fetch the archive data:', error);
        return;
    }

    // Creating modal
    const modal = document.createElement('div');
    modal.id = 'options-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    // Creating modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white p-8 flex flex-col h-5/6 rounded-lg shadow-lg w-11/12 bg-indigo-100';

    // API Section
    const apiSection = document.createElement('div');
    const apiTitle = document.createElement('h3');
    apiTitle.textContent = 'Clés API';
    apiTitle.className = 'mb-4 font-bold text-lg';

    const apiInput = document.createElement('input');
    apiInput.type = 'text';
    apiInput.placeholder = 'Entrez la clé API';
    apiInput.className = 'github-key-input w-full p-2 mb-4 border border-gray-300 rounded';

    const githubKey = dataStore.githubKey; 
    if(githubKey){
        apiInput.value = githubKey;
    }

    apiSection.append(apiTitle, apiInput);

    // Magazine Section (Table)
    const magazineSection = document.createElement('div');
    magazineSection.className = 'flex-grow overflow-y-auto';
    const magazineTitle = document.createElement('h3');
    magazineTitle.textContent = 'Paramètres des numéros de magazine';
    magazineTitle.className = 'mb-4 font-bold text-lg';

    const magazineTable = document.createElement('table');
    magazineTable.className = 'w-full border-collapse';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Numéro', 'Période', 'Statut'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.className = 'border-b p-2 text-left';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    magazineTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    archiveData.forEach(item => {
        const row = document.createElement('tr');

        const issueNumberCell = document.createElement('td');
        issueNumberCell.textContent = item.issueNumber;
        issueNumberCell.className = 'border-b p-2';
        row.appendChild(issueNumberCell);

        const periodCell = document.createElement('td');
        periodCell.textContent = item.period;
        periodCell.className = 'border-b p-2';
        row.appendChild(periodCell);

        const statusCell = document.createElement('td');
        const statusSelect = document.createElement('select');
        statusSelect.className = 'p-1 border border-gray-300 rounded';
        const draftOption = new Option('Brouillon', 'draft', false, item.status == 'draft');
        const currentOption = new Option('Numéro actuel', 'current', false, item.status == 'current');
        const archiveOption = new Option('Archive', 'archive', false, !item.status || item.status == 'archive');
        statusSelect.add(draftOption);
        statusSelect.add(currentOption);
        statusSelect.add(archiveOption);
        statusCell.appendChild(statusSelect);
        statusCell.className = 'border-b p-2';
        row.appendChild(statusCell);

        row.th_fileName = item.file;
        row.th_fileOnly = item.fileOnly;

        tbody.appendChild(row);
    });
    magazineTable.appendChild(tbody);

    magazineSection.append(magazineTitle, magazineTable);

    // Adding sections to modal content
    modalContent.append(apiSection, magazineSection);

    // Close and Save buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex items-center mt-4';

    // Close button
    const closeModal = document.createElement('button');
    closeModal.textContent = 'Fermer';
    closeModal.className = 'mt-4 px-6 mx-4 py-2 bg-red-500 text-white rounded cursor-pointer';

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Save btn
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Enregistrer';
    saveButton.className = 'mt-4 px-6 mx-4 py-2 bg-green-500 text-white rounded cursor-pointer';
    saveButton.addEventListener('click', () => {
        saveSettings();
    });

    buttonContainer.appendChild(closeModal);
    buttonContainer.appendChild(saveButton);
    modalContent.appendChild(buttonContainer);

    // modalContent.appendChild(closeModal);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
}

async function saveSettings() {
    // const { pushFilesToGitHub } = await require(`/js/m_github_api.js?t=${new Date().getTime()}`);
    const githubKeyInput = document.querySelector('.github-key-input');
    const githubKey = githubKeyInput.value;
    dataStore.githubKey = githubKey; // Update the dataStore
    
    const archiveData = gatherTableData();
    // pushJsonToGithub('archive.json', archiveData);
    const path = 'archive.json';
    const content = JSON.stringify(archiveData, null, 4);
    const type = 'application/json';
    const files = [{ path, content, type }];
    const commitMessage = 'Submitting archive.json';
    pushFilesToGitHub({ files, commitMessage });
    console.log({archiveData});
}

function gatherTableData() {
    const tableData = [];
    const magazineTable = document.querySelector('table'); // Assuming there's only one table or modify selector if needed
    const rows = magazineTable.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const issueNumber = row.cells[0].textContent;
        const period = row.cells[1].textContent;
        const statusSelect = row.cells[2].querySelector('select');
        const status = statusSelect.value; // Selected status

        // Create object for each row
        const rowData = {
            period: period,
            issueNumber: Number(issueNumber),
            status,
            file: row.th_fileName, 
            fileOnly: row.th_fileOnly
        };

        tableData.push(rowData);
    });

    return tableData;
}

function __pushJsonToGithub(path, jsonObj){
    const token = window.localStorage.getItem("githubKey");
    const owner = GITHUB_OWNER;
    const repo = GITHUB_REPO;
    // const path = 'newfile.json';
    const content = JSON.stringify(jsonObj, null, 4); 
    const base64Content = btoa(decodeURIComponent(encodeURIComponent(content)));
    
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    fetch(apiUrl, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json"
        }
    })
        .then(shaResponse=>shaResponse.json())
        .then(shaData=>{
            const sha = shaData.sha;
            return fetch(apiUrl, {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json"
              },
              body: JSON.stringify({
                message: `Submitting file ${path}`,
                content: base64Content,
                sha
              })
            })
        })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
    
}

export { showOptions };