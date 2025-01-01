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
    modalContent.className = 'bg-white p-8 rounded-lg shadow-lg max-w-md w-11/12';

    // API Section
    const apiSection = document.createElement('div');
    const apiTitle = document.createElement('h3');
    apiTitle.textContent = 'Clés API';
    apiTitle.className = 'mb-4 font-bold text-lg';

    const apiInput = document.createElement('input');
    apiInput.type = 'text';
    apiInput.placeholder = 'Entrez la clé API';
    apiInput.className = 'w-full p-2 mb-4 border border-gray-300 rounded';

    apiSection.append(apiTitle, apiInput);

    // Magazine Section (Table)
    const magazineSection = document.createElement('div');
    const magazineTitle = document.createElement('h3');
    magazineTitle.textContent = 'Paramètres des numéros de magazine';
    magazineTitle.className = 'mb-4 font-bold text-lg';

    const magazineTable = document.createElement('table');
    magazineTable.className = 'w-full border-collapse';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Numéro de magazine', 'Période', 'Statut'].forEach(text => {
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
        const draftOption = new Option('Brouillon', 'draft');
        const currentOption = new Option('Numéro actuel', 'current');
        const archiveOption = new Option('Archive', 'archive');
        statusSelect.add(draftOption);
        statusSelect.add(currentOption);
        statusSelect.add(archiveOption);
        statusCell.appendChild(statusSelect);
        statusCell.className = 'border-b p-2';
        row.appendChild(statusCell);

        tbody.appendChild(row);
    });
    magazineTable.appendChild(tbody);

    magazineSection.append(magazineTitle, magazineTable);

    // Adding sections to modal content
    modalContent.append(apiSection, magazineSection);

    // Close button
    const closeModal = document.createElement('button');
    closeModal.textContent = 'Fermer';
    closeModal.className = 'mt-4 px-6 py-2 bg-red-500 text-white rounded cursor-pointer';

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modalContent.appendChild(closeModal);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
}